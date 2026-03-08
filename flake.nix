{
  description = "Recipe app - TanStack Start";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        packages = { };

        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.bun
            pkgs.nodejs
            pkgs.turso-cli
            pkgs.patchelf
            pkgs.cacert
          ];

          # See: https://github.com/cloudflare/workerd/issues/1482
          #      https://github.com/cloudflare/workerd/discussions/1515#discussioncomment-7998115
          shellHook = ''
            export SSL_CERT_FILE="${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt"

            __patchTarget="./node_modules/@cloudflare/workerd-linux-64/bin/workerd"
            if [[ -f "$__patchTarget" ]]; then
              ${pkgs.patchelf}/bin/patchelf --set-interpreter ${pkgs.glibc}/lib/ld-linux-x86-64.so.2 "$__patchTarget"
            fi
          '';
        };
      }
    );
}

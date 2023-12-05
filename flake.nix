{
  description = "Build a cargo project";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        inherit (pkgs) lib;
      in
      {
        packages = { };

        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.nodejs_20
            pkgs.nodePackages.pnpm
            pkgs.turso-cli
          ];
        };
      });
}

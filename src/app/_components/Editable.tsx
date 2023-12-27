import { useEffect, useRef } from "react";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

// https://dtang.dev/using-content-editable-in-react/
export function EditableDiv({
  value,
  onChange,
  contentEditable,
  className,
}: {
  value: string;
  onChange?: (e: string) => void;
  contentEditable: "plaintext-only" | false;
  className: string;
}) {
  const contentEditableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentEditableRef.current!.textContent !== value) {
      contentEditableRef.current!.textContent = value;
    }
  });

  const handleChange = (event: React.ChangeEvent<HTMLDivElement>) => {
    if (onChange) {
      onChange(event.target.innerHTML);
    }
  };

  return (
    <div
      className={classNames(
        className,
        contentEditable ? "hover:bg-slate-50 focus:bg-transparent" : "",
      )}
      contentEditable={contentEditable}
      suppressContentEditableWarning={true}
      onInput={handleChange}
      ref={contentEditableRef}
    />
  );
}

export function EditableLi({
  value,
  onChange,
  contentEditable,
  className,
  keyName,
}: {
  value: string;
  onChange?: (e: string) => void;
  contentEditable: "plaintext-only" | false;
  className?: string;
  keyName: string;
}) {
  const contentEditableRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (contentEditableRef.current!.textContent !== value) {
      contentEditableRef.current!.textContent = value;
    }
  });

  const handleChange = (event: React.ChangeEvent<HTMLLIElement>) => {
    if (onChange) {
      onChange(event.target.innerHTML);
    }
  };

  return (
    <li
      className={classNames(
        className ?? "",
        contentEditable ? "hover:bg-slate-50 focus:bg-transparent" : "",
      )}
      contentEditable={contentEditable}
      suppressContentEditableWarning={true}
      onInput={handleChange}
      ref={contentEditableRef}
      key={keyName}
    />
  );
}

export function EditableHeader({
  value,
  onChange,
  contentEditable,
  className,
}: {
  value: string;
  onChange?: (e: string) => void;
  contentEditable: "plaintext-only" | false;
  className?: string;
}) {
  const contentEditableRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (contentEditableRef.current!.textContent !== value) {
      contentEditableRef.current!.textContent = value;
    }
  });

  const handleChange = (event: React.ChangeEvent<HTMLHeadingElement>) => {
    if (onChange) {
      onChange(event.target.innerHTML);
    }
  };

  return (
    <h4
      className={classNames(
        className ?? "",
        contentEditable ? "hover:bg-slate-50 focus:bg-transparent" : "",
      )}
      contentEditable={contentEditable}
      suppressContentEditableWarning={true}
      onInput={handleChange}
      ref={contentEditableRef}
    />
  );
}

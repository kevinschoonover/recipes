import { useEffect, useRef } from "react";

import { PlusIcon } from "@heroicons/react/20/solid";

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
    <>
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
    </>
  );
}

export function EditableLi({
  value,
  onChange,
  onAdd,
  contentEditable,
  className,
  keyName,
}: {
  value: string;
  onChange?: (e: string) => void;
  onAdd?: () => void;
  contentEditable: "plaintext-only" | false;
  className?: string;
  keyName: string;
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
    <>
      <li
        className={classNames(
          className ?? "",
          "group relative",
          contentEditable ? "hover:bg-slate-50 focus:bg-transparent" : "",
        )}
        suppressContentEditableWarning={true}
        key={keyName}
      >
        <div
          className="pr-5"
          onInput={handleChange}
          contentEditable={contentEditable}
          ref={contentEditableRef}
        />
        {contentEditable && (
          <button
            onClick={onAdd}
            className="absolute right-0 top-0 hidden group-hover:inline-block"
          >
            <PlusIcon className="h-5" />
          </button>
        )}
      </li>
    </>
  );
}

export function EditableHeader({
  value,
  onChange,
  onAdd,
  contentEditable,
  className,
}: {
  value: string;
  onChange?: (e: string) => void;
  onAdd?: () => void;
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
        "group relative",
        contentEditable ? "hover:bg-slate-50 focus:bg-transparent" : "",
      )}
      suppressContentEditableWarning={true}
      onInput={handleChange}
    >
      <div
        className="pr-5"
        onInput={handleChange}
        contentEditable={contentEditable}
        ref={contentEditableRef}
      />
      {contentEditable && (
        <button
          onClick={onAdd}
          className="absolute right-0 top-0 hidden group-hover:inline-block"
        >
          <PlusIcon className="h-5" />
        </button>
      )}
    </h4>
  );
}

export function EditableTitle({
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
    <h1
      className={classNames(
        className ?? "",
        contentEditable ? "hover:bg-slate-50 focus:bg-transparent" : "",
      )}
      suppressContentEditableWarning={true}
      onInput={handleChange}
      contentEditable={contentEditable}
      ref={contentEditableRef}
    />
  );
}

"use client";

import { useContext, useState, Fragment, useRef, useEffect } from "react";

import { Disclosure, Dialog, Transition } from "@headlessui/react";
import {
  MinusIcon,
  PlusIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  type NutritionInformation,
  type HowToStep,
  type HowToSection,
} from "schema-dts";
import { type Session } from "next-auth";

import { api } from "~/trpc/react";
import {
  SelectedRecipeContext,
  ParseRecipe,
  type ParsedRecipe,
} from "~/app/_providers/SelectedRecipeProvider";
import {
  EditableLi,
  EditableDiv,
  EditableHeader,
  EditableTitle,
} from "~/app/_components/Editable";
import NutritionLabel from "~/app/_components/NutritionLabel";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface RecipePanelProps {
  session: Session | null;
}

function renderRecipeInstructions(
  doc: ParsedRecipe | undefined,
  setDoc: (arg: ParsedRecipe) => void,
  contentEditable: "plaintext-only" | false,
): React.ReactNode {
  const sections: HowToSection[] = [];
  const currentSection: HowToStep[] = [];
  const recipeInstructions = doc?.document.recipeInstructions?.valueOf();
  if (
    recipeInstructions instanceof Object &&
    Array.isArray(recipeInstructions)
  ) {
    recipeInstructions.forEach((instruction) => {
      if ((instruction as HowToStep)["@type"] === "HowToStep") {
        currentSection.push(instruction as HowToStep);
      }
      if ((instruction as HowToSection)["@type"] === "HowToSection") {
        sections.push(instruction as HowToSection);
      }
    });
  }
  if (sections.length > 0) {
    return sections.map((section, sectionIndex) => {
      const parsedItems: HowToStep[] = [];
      const items = section.itemListElement?.valueOf();
      if (Array.isArray(items)) {
        items.forEach((item) => {
          if ((item as HowToStep)["@type"] === "HowToStep") {
            parsedItems.push(item as HowToStep);
          }
        });
      }

      if (parsedItems.length < 1 && contentEditable) {
        parsedItems.push({
          "@id": "HowToStep",
          text: "Example Step",
        } as HowToStep);
      }

      return (
        <section
          key={`section-${sectionIndex}`}
          aria-label={section.name?.toString()}
        >
          <EditableHeader
            value={section.name?.toString() ?? "Example Header"}
            contentEditable={contentEditable}
            onDelete={() => {
              const localDocument = JSON.parse(
                JSON.stringify(doc),
              ) as ParsedRecipe;
              (
                localDocument.document.recipeInstructions as HowToSection[]
              ).splice(sectionIndex, 1);
              setDoc(localDocument);
            }}
            onAdd={() => {
              const localDocument = JSON.parse(
                JSON.stringify(doc),
              ) as ParsedRecipe;
              (
                localDocument.document.recipeInstructions as HowToSection[]
              ).splice(sectionIndex + 1, 0, {
                "@type": "HowToSection",
              } as HowToSection);
              setDoc(localDocument);
            }}
            onChange={(text) => {
              const localDocument = JSON.parse(
                JSON.stringify(doc),
              ) as ParsedRecipe;
              (localDocument.document.recipeInstructions as HowToSection[])[
                sectionIndex
              ]!.name = text;
              setDoc(localDocument);
            }}
          />
          <ol key={`ol-${section.name?.toString()}`}>
            {parsedItems.map((instruction, instructionIndex) => (
              <EditableLi
                value={instruction.text?.toString() ?? ""}
                contentEditable={contentEditable}
                onAdd={() => {
                  const localDocument = JSON.parse(
                    JSON.stringify(doc),
                  ) as ParsedRecipe;

                  ((
                    localDocument.document.recipeInstructions as HowToSection[]
                  )[sectionIndex]!.itemListElement as HowToStep[])!.splice(
                    instructionIndex + 1,
                    0,
                    {
                      "@type": "HowToStep",
                    } as HowToStep,
                  );
                  setDoc(localDocument);
                }}
                onDelete={() => {
                  const localDocument = JSON.parse(
                    JSON.stringify(doc),
                  ) as ParsedRecipe;
                  ((
                    localDocument.document.recipeInstructions as HowToSection[]
                  )[sectionIndex]!.itemListElement as HowToStep[])!.splice(
                    instructionIndex,
                    1,
                  );
                  setDoc(localDocument);
                }}
                onChange={(text) => {
                  const localDocument = JSON.parse(
                    JSON.stringify(doc),
                  ) as ParsedRecipe;
                  ((
                    localDocument.document.recipeInstructions as HowToSection[]
                  )[sectionIndex]!.itemListElement as HowToStep[])![
                    instructionIndex
                  ]!.text = text;
                  setDoc(localDocument);
                }}
                keyName={`instruction-${sectionIndex}-${instructionIndex}`}
              />
            ))}
          </ol>
        </section>
      );
    });
  }

  if (currentSection.length < 1 && contentEditable) {
    currentSection.push({
      "@type": "HowToStep",
      text: "Example Step",
    } as HowToStep);
  }

  // by default, return a list with no section header. i dont know if this is the behavior I want to preserve
  // in the future
  return (
    <ol>
      {currentSection.map((instruction, instructionIndex) => (
        <EditableLi
          value={instruction.text?.toString() ?? ""}
          contentEditable={contentEditable}
          onAdd={() => {
            const localDocument = JSON.parse(
              JSON.stringify(doc),
            ) as ParsedRecipe;
            (localDocument.document.recipeInstructions as HowToStep[]).splice(
              instructionIndex + 1,
              0,
              { "@type": "HowToStep" },
            );
            setDoc(localDocument);
          }}
          onChange={(text) => {
            const localDocument = JSON.parse(
              JSON.stringify(doc),
            ) as ParsedRecipe;
            if (!localDocument.document.recipeInstructions) {
              localDocument.document.recipeInstructions = [];
            }
            const currentInstruction = (
              localDocument.document.recipeInstructions as HowToStep[]
            )[instructionIndex] ?? { "@type": "HowToStep" };
            currentInstruction.text = text;
            (localDocument.document.recipeInstructions as HowToStep[]).splice(
              instructionIndex,
              1,
              currentInstruction,
            );
            setDoc(localDocument);
          }}
          onDelete={() => {
            const localDocument = JSON.parse(
              JSON.stringify(doc),
            ) as ParsedRecipe;
            (localDocument.document.recipeInstructions as HowToStep[]).splice(
              instructionIndex,
              1,
            );
            setDoc(localDocument);
          }}
          keyName={`instruction-${instructionIndex}`}
        />
      ))}
    </ol>
  );
}

export default function RecipePanel({ session }: RecipePanelProps) {
  const [url, setURL] = useState("");
  const [open, setOpen] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const { selectedRecipe, setSelectedRecipe, editMode, setEditMode } =
    useContext(SelectedRecipeContext);
  const [editedDocument, setEditedDocument] = useState<
    ParsedRecipe | undefined
  >(selectedRecipe);

  useEffect(() => {
    if (selectedRecipe) {
      setEditedDocument(selectedRecipe);
    }
  }, [selectedRecipe]);

  const cancelButtonRef = useRef(null);

  const utils = api.useUtils();

  const importRecipe = api.recipe.import.useMutation({
    onSuccess: async (result) => {
      setURL("");
      setOpen(false);
      setSelectedRecipe(ParseRecipe(result));
      await utils.recipe.all.invalidate();
    },
  });
  const deleteRecipe = api.recipe.delete.useMutation({
    onSuccess: async () => {
      setURL("");
      setOpen(false);
      setSelectedRecipe(undefined);
      await utils.recipe.all.invalidate();
    },
  });

  let recipeBody = (
    <div className="p-6">
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          No Recipe Selected
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by selecting a recipe or import one.
        </p>
        {session && (
          <div className="mt-6 flex items-center justify-center">
            <div className="min-w-24 col-span-4 flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
              <input
                type="text"
                name="url"
                id="url"
                autoComplete="url"
                className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                onChange={(e) => setURL(e.target.value)}
              />
            </div>
            <div>
              <button
                type="button"
                className="ml-4 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                disabled={url === "" || importRecipe.isLoading}
                onClick={(e) => {
                  e.preventDefault();
                  importRecipe.mutate({ url });
                }}
              >
                <PlusIcon
                  className="-ml-0.5 mr-1.5 h-5 w-5"
                  aria-hidden="true"
                />
                {importRecipe.isLoading ? "Importing..." : "Import Recipe"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (selectedRecipe) {
    const parsedIngredients: string[] = [];
    const doc = editMode ? editedDocument : selectedRecipe ?? {};
    const instructions = doc?.document.recipeInstructions?.valueOf() ?? [];
    const ingredients = doc?.document.recipeIngredient?.valueOf() ?? [];
    const sourceURL = doc?.document["@id"] ?? doc?.importedFrom;
    if (ingredients instanceof Object && Array.isArray(ingredients)) {
      ingredients.forEach((ingredient) => {
        if (typeof ingredient == "string") {
          parsedIngredients.push(ingredient);
        }
      });
    }

    if (parsedIngredients.length < 1 && editMode) {
      parsedIngredients.push("Example Ingredient");
    }

    const recipeSections = [
      {
        name: "Ingredients",
        defaultOpen: editMode,
        body:
          parsedIngredients.length > 0 ? (
            <ul>
              {parsedIngredients.map((ingredient, ingredientIndex) => (
                <EditableLi
                  value={ingredient}
                  contentEditable={editMode ? "plaintext-only" : false}
                  onChange={(text) => {
                    const localDocument = JSON.parse(
                      JSON.stringify(editedDocument),
                    ) as ParsedRecipe;
                    if (!localDocument.document.recipeIngredient) {
                      localDocument.document.recipeIngredient = [];
                    }
                    (
                      localDocument.document.recipeIngredient as string[]
                    ).splice(ingredientIndex, 1, text);
                    setEditedDocument(localDocument);
                  }}
                  keyName={`ingredient-${ingredientIndex}`}
                />
              ))}
            </ul>
          ) : undefined,
      },
      {
        name: "Instructions",
        defaultOpen: true,
        body: instructions
          ? renderRecipeInstructions(
              doc,
              setEditedDocument,
              editMode ? "plaintext-only" : false,
            )
          : undefined,
      },
      {
        name: "Nutrition Facts",
        defaultOpen: editMode,
        body: doc?.document?.nutrition ? (
          <NutritionLabel
            recipeYield="TODO"
            nutritionFacts={doc.document.nutrition as NutritionInformation}
          />
        ) : undefined,
      },
    ];

    recipeBody = (
      <div className="bg-white">
        {/* delete modal */}
        <Transition.Root show={open} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-10"
            initialFocus={cancelButtonRef}
            onClose={setOpen}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <ExclamationTriangleIcon
                          className="h-6 w-6 text-red-600"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <Dialog.Title
                          as="h3"
                          className="text-base font-semibold leading-6 text-gray-900"
                        >
                          Delete Recipe
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Are you sure you want to delete the recipe? All of
                            the data will be permanently removed from our
                            servers forever. This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                        onClick={() => {
                          deleteRecipe.mutate({ slug: selectedRecipe.slug });
                        }}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        onClick={() => setOpen(false)}
                        ref={cancelButtonRef}
                      >
                        Cancel
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition.Root>

        {/* main content */}
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16 lg:max-w-7xl lg:px-8">
          <div className="lg:grid lg:grid-cols-1 lg:items-start lg:gap-x-8">
            {/* Product info */}
            <div className="mt-10 px-4 sm:mt-8 sm:px-0 lg:mt-0">
              <EditableTitle
                className="align-center flex items-center text-3xl font-bold tracking-tight text-gray-900"
                contentEditable={editMode ? "plaintext-only" : false}
                value={doc?.name ?? "unknown"}
                onChange={(text) => {
                  const localDocument = JSON.parse(
                    JSON.stringify(editedDocument),
                  ) as ParsedRecipe;
                  localDocument.document.name = text;
                  localDocument.name = text;
                  setEditedDocument(localDocument);
                }}
              />
              <div className="mt-1 flex space-x-4">
                <button
                  type="button"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  onClick={() => {
                    setEditMode(!editMode);
                    setEditedDocument(selectedRecipe);
                  }}
                >
                  {editMode ? "Cancel" : "Edit"}
                </button>
                <div className="flex border-l border-gray-300 pl-4">
                  <button
                    type="button"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    onClick={() => setOpen(true)}
                  >
                    Remove
                  </button>
                </div>
                {sourceURL && (
                  <div className="flex border-l border-gray-300 pl-4">
                    <a
                      target="_blank"
                      href={sourceURL}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View Source
                    </a>
                  </div>
                )}
                <div className="flex border-l border-gray-300 pl-4">
                  <button
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    onClick={() => setShowDocument(!showDocument)}
                  >
                    {showDocument ? "Show Main Window" : "View Document"}
                  </button>
                </div>
              </div>
              {showDocument ? (
                <pre className="mt-4">
                  {JSON.stringify(doc?.document ?? {}, undefined, 2)}
                </pre>
              ) : (
                <>
                  <div className="mt-6">
                    <h3 className="sr-only">Description</h3>
                    <EditableDiv
                      value={
                        doc?.document.description?.toString() ??
                        (editMode ? "Example Description" : "")
                      }
                      className="space-y-6 text-base text-gray-700"
                      contentEditable={editMode ? "plaintext-only" : false}
                      onChange={(text) => {
                        const localDocument = JSON.parse(
                          JSON.stringify(editedDocument),
                        ) as ParsedRecipe;
                        localDocument.document.description = text;
                        setEditedDocument(localDocument);
                      }}
                    />
                  </div>
                  <section aria-labelledby="details-heading" className="mt-12">
                    <h2 id="details-heading" className="sr-only">
                      Additional details
                    </h2>

                    <div className="divide-y divide-gray-200 border-t">
                      {recipeSections.map(
                        (section) =>
                          section.body && (
                            <Disclosure
                              as="div"
                              key={section.name}
                              defaultOpen={section.defaultOpen}
                            >
                              {({ open }) => (
                                <>
                                  <h3>
                                    <Disclosure.Button className="group relative flex w-full items-center justify-between py-6 text-left">
                                      <span
                                        className={classNames(
                                          open
                                            ? "text-indigo-600"
                                            : "text-gray-900",
                                          "text-sm font-medium",
                                        )}
                                      >
                                        {section.name}
                                      </span>
                                      <span className="ml-6 flex items-center">
                                        {open ? (
                                          <MinusIcon
                                            className="block h-6 w-6 text-indigo-400 group-hover:text-indigo-500"
                                            aria-hidden="true"
                                          />
                                        ) : (
                                          <PlusIcon
                                            className="block h-6 w-6 text-gray-400 group-hover:text-gray-500"
                                            aria-hidden="true"
                                          />
                                        )}
                                      </span>
                                    </Disclosure.Button>
                                  </h3>
                                  <Disclosure.Panel
                                    as="div"
                                    className="prose prose-sm pb-6"
                                  >
                                    {section.body}
                                  </Disclosure.Panel>
                                </>
                              )}
                            </Disclosure>
                          ),
                      )}
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return recipeBody;
}

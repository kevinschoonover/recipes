import { type NutritionInformation } from "schema-dts";
import { EditableDiv } from "./Editable";

export default function NutritionLabel({
  recipeYield,
  nutritionFacts,
  editMode,
}: {
  recipeYield: string;
  nutritionFacts: NutritionInformation;
  editMode: boolean;
}) {
  //www.fda.gov/food/food-labeling-nutrition/changes-nutrition-facts-label
  return (
    <div className="w-96 border-2 border-black p-1 font-sans">
      <div className="text-4xl font-extrabold leading-none">
        Nutrition Facts
      </div>
      <div className="leading-snug">{recipeYield}</div>
      <div className="flex justify-between border-b-8 border-black font-bold">
        <div>Serving size</div>
        <EditableDiv
          value={nutritionFacts.servingSize?.toString() ?? "0"}
          className="space-y-6 text-base text-gray-700"
          contentEditable={editMode ? "plaintext-only" : false}
          onChange={(text) => {
            console.log(text);
            // const localDocument = JSON.parse(
            //   JSON.stringify(editedDocument),
            // ) as ParsedRecipe;
            // localDocument.document.description = text;
            // setEditedDocument(localDocument);
          }}
        />
        <div>{nutritionFacts.servingSize?.toString()}</div>
      </div>
      <div className="flex items-end justify-between font-extrabold">
        <div>
          <div className="font-bold">Amount per serving</div>
          <div className="text-4xl">Calories</div>
        </div>
        <div className="text-5xl">{nutritionFacts.calories?.toString()}</div>
      </div>
      <div className="border-t-4 border-black pb-1 text-sm">
        <div className="pb-1 pt-1 text-right font-bold">% Daily value*</div>
        <hr className="m-2 border-gray-500" />
        <div className="flex justify-between">
          <div>
            <span className="font-bold">Total Fat</span>{" "}
            {nutritionFacts.fatContent?.toString()}
          </div>
          <div className="pr-1 font-bold">TODO</div>
        </div>
        <hr className="m-2 border-gray-500" />
        <div className="flex justify-between pl-4">
          <div>
            Saturated Fat {nutritionFacts.saturatedFatContent?.toString()}
          </div>
          <div className="pr-1 font-bold">TODO</div>
        </div>
        <hr className="m-2 border-gray-500" />
        <div className="flex justify-between pl-4">
          <span className="italic">Trans Fat</span>{" "}
          {nutritionFacts.transFatContent?.toString()}
          <div className="pr-1 font-bold">TODO</div>
        </div>
        <hr className="m-2 border-gray-500" />
        <div className="flex justify-between">
          <div>
            <span className="font-bold">Cholesterol</span>{" "}
            {nutritionFacts.cholesterolContent?.toString()}
          </div>
          <div className="pr-1 font-bold">TODO</div>
        </div>
        <hr className="m-2 border-gray-500" />
        <div className="flex justify-between">
          <div>
            <span className="font-bold">Sodium</span>{" "}
            {nutritionFacts.sodiumContent?.toString()}
          </div>
          <div className="pr-1 font-bold">TODO</div>
        </div>
        <hr className="m-2 border-gray-500" />
        <div className="flex justify-between">
          <div>
            <span className="font-bold">Total Carbohydrate</span>{" "}
            {nutritionFacts.carbohydrateContent?.toString()}
          </div>
          <div className="pr-1 font-bold">TODO</div>
        </div>
        <hr className="m-2 border-gray-500" />
        <div className="flex justify-between">
          <div className="pl-4">
            Dietary Fiber {nutritionFacts.fiberContent?.toString()}
          </div>
          <div className="pr-1 font-bold">TODO</div>
        </div>
        <hr className="m-2 border-gray-500" />
        <div className="pl-4">
          Total Sugar {nutritionFacts.sugarContent?.toString()}
          <div className="pl-4">
            <hr className="m-2 border-gray-500" />
            <div className="flex justify-between">
              <div>Includes 10g Added Sugars</div>
              <div className="pr-1 font-bold">TODO</div>
            </div>
          </div>
        </div>
        <hr className="m-2 border-gray-500" />
        <div>
          <span className="pl-1 font-bold">Protein</span>{" "}
          {nutritionFacts.proteinContent?.toString()}
        </div>
      </div>
      {/* <div className="border-t-8 border-black pt-1 text-sm">
        <div className="flex justify-between">
          <div>Vitamin D 2mcg{nutritionFacts.</div>
          <div>10%</div>
        </div>
        <hr className="border-gray-500" />
        <div className="flex justify-between">
          <div>Calcium 260mg</div>
          <div>20%</div>
        </div>
        <hr className="border-gray-500" />
        <div className="flex justify-between">
          <div>Iron 8mg</div>
          <div>45%</div>
        </div>
        <hr className="border-gray-500" />
        <div className="flex justify-between">
          <div>Potassium 240mg</div>
          <div>6%</div>
        </div> */}
      <div className="flex border-t-4 border-black pb-1 pt-2 text-xs leading-none">
        <div className="pr-1">*</div>
        <div>
          The % Daily Value (DV) tells you how much a nutrient in a serving of
          food contributes to a daily diet. 2,000 calories a day is used for
          general nutrition advice.
        </div>
      </div>
    </div>
  );
}

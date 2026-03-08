import { createFormHook } from "@tanstack/react-form";
import {
  TextField,
  TextArea,
  NumberField,
  Select,
  SubmitButton,
  ImageUpload,
} from "#/components/FormComponents";
import { fieldContext, formContext } from "./form-context";

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    TextArea,
    NumberField,
    Select,
    ImageUpload,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
});

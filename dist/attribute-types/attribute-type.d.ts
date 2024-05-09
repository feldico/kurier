import { ApplicationAttributeTypeFactory, ApplicationAttributeTypeOptions } from "../types";
export default function AttributeType<StoredDataType = string, JsonDataType = StoredDataType>(name: string, options: ApplicationAttributeTypeOptions<StoredDataType, JsonDataType>): ApplicationAttributeTypeFactory;

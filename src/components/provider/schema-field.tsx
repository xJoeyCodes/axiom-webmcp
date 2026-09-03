import type { WebMCPSchema } from "@/lib/types/axiom";
import {
  schemaChildren,
  schemaTypeLabel,
  schemaValueLabel,
} from "@/lib/utils/schema";

interface SchemaFieldProps {
  description?: string;
  name: string;
  required?: boolean;
  schema: WebMCPSchema;
}

export function SchemaField({
  description,
  name,
  required = false,
  schema,
}: SchemaFieldProps) {
  const children = schemaChildren(schema);
  const fieldDescription = description ?? schema.description;

  return (
    <li className="border-border border-b last:border-b-0">
      <div className="grid min-w-0 gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,auto)_5.5rem] sm:items-start sm:gap-5">
        <div className="min-w-0">
          <p className="text-foreground font-mono text-[11px] break-all sm:text-xs">
            {name}
          </p>
          {fieldDescription ? (
            <p className="text-muted mt-1.5 max-w-xl text-xs leading-5">
              {fieldDescription}
            </p>
          ) : null}
        </div>
        <p className="text-secondary font-mono text-[10px] break-all sm:text-right">
          {schemaTypeLabel(schema)}
        </p>
        <p className="text-muted font-mono text-[9px] tracking-[0.08em] uppercase sm:text-right">
          {required ? "Required" : "Optional"}
        </p>
      </div>

      {schema.enum?.length || schema.default !== undefined ? (
        <div className="text-muted flex flex-wrap gap-x-5 gap-y-1 pb-4 font-mono text-[9px]">
          {schema.enum?.length ? (
            <span>enum: {schema.enum.map(schemaValueLabel).join(" | ")}</span>
          ) : null}
          {schema.default !== undefined ? (
            <span>default: {schemaValueLabel(schema.default)}</span>
          ) : null}
        </div>
      ) : null}

      {children.length > 0 ? (
        <ul className="border-border mb-4 ml-2 border-l pl-4 sm:ml-4 sm:pl-5">
          {children.map((child) => (
            <SchemaField
              key={child.name}
              name={child.name}
              required={child.required}
              schema={child.schema}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

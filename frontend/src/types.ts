export type AppState = "APPLIED" | "INTERVIEWING" | "OFFER" | "REJECTED";

export interface Application {
  id: number;
  title: string;
  company: string;
  date_applied: string;
  state: AppState;
  link: string;
}

export interface FieldChoice {
  value: string;
  display_name: string;
}

export interface SchemaField {
  type: string;
  required: boolean;
  read_only?: boolean;
  label: string;
  choices?: FieldChoice[];
}

export type Schema = Record<string, SchemaField>;

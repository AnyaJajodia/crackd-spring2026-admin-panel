export type PaginationQuery = {
  page: number;
  pageSize: number;
  search: string;
};

export type PaginatedResult<T> = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  rows: T[];
};

export type ImagesFilterState = PaginationQuery & {
  visibility: "all" | "public" | "private";
  commonUse: "all" | "common" | "not_common";
};

export type ImageManagementRow = {
  id: string;
  created_datetime_utc: string | null;
  modified_datetime_utc: string | null;
  url: string | null;
  is_common_use: boolean | null;
  profile_id: string | null;
  additional_context: string | null;
  is_public: boolean | null;
  image_description: string | null;
  celebrity_recognition: string | null;
};

export type ImageUpdateInput = {
  id: string;
  is_common_use: boolean;
  is_public: boolean;
  additional_context: string;
  image_description: string;
};

export type CaptionsFilterState = PaginationQuery & {
  visibility: "all" | "public" | "private";
  featured: "all" | "featured" | "not_featured";
  sort: "newest" | "likes";
};

export type CaptionManagementRow = {
  id: string;
  created_datetime_utc: string | null;
  modified_datetime_utc: string | null;
  content: string | null;
  is_public: boolean | null;
  profile_id: string | null;
  image_id: string | null;
  humor_flavor_id: number | null;
  is_featured: boolean | null;
  caption_request_id: number | null;
  like_count: number | null;
  llm_prompt_chain_id: number | null;
  image_url: string | null;
  humor_flavor_slug: string | null;
  llm_prompt_chain_label: string | null;
};

export type CaptionUpdateInput = {
  id: string;
  is_public: boolean;
  is_featured: boolean;
};

export type ProfilesFilterState = PaginationQuery & {
  role: "all" | "superadmins" | "matrix_admins" | "in_study";
};

export type ProfileManagementRow = {
  id: string;
  created_datetime_utc: string | null;
  modified_datetime_utc: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  is_superadmin: boolean | null;
  is_in_study: boolean | null;
  is_matrix_admin: boolean | null;
};

export type ProfileUpdateChanges = Partial<{
  first_name: string;
  last_name: string;
  is_superadmin: boolean;
  is_in_study: boolean;
  is_matrix_admin: boolean;
}>;

export type ProfileUpdateInput = {
  id: string;
  changes: ProfileUpdateChanges;
};

export type LookupOption = {
  value: string;
  label: string;
  description?: string | null;
};

export type HumorFlavorsFilterState = PaginationQuery & {
  stepStatus: "all" | "has_steps" | "no_steps";
  sort: "newest" | "oldest";
};

export type HumorFlavorManagementRow = {
  id: number;
  created_datetime_utc: string;
  description: string | null;
  slug: string;
  step_count: number;
};

export type HumorFlavorStepsFilterState = PaginationQuery & {
  humorFlavorIds: string;
  llmModelIds: string;
  sort: "created_desc" | "order_asc" | "order_desc";
};

export type HumorFlavorStepManagementRow = {
  id: number;
  created_datetime_utc: string;
  humor_flavor_id: number;
  humor_flavor_slug: string | null;
  llm_temperature: number | null;
  order_by: number;
  llm_input_type_id: number;
  llm_input_type_slug: string | null;
  llm_output_type_id: number;
  llm_output_type_slug: string | null;
  llm_model_id: number;
  llm_model_name: string | null;
  humor_flavor_step_type_id: number;
  humor_flavor_step_type_slug: string | null;
  llm_system_prompt: string | null;
  llm_user_prompt: string | null;
  description: string | null;
};

export type HumorMixFilterState = PaginationQuery;

export type HumorMixManagementRow = {
  id: number;
  created_datetime_utc: string;
  humor_flavor_id: number;
  humor_flavor_slug: string | null;
  humor_flavor_description: string | null;
  caption_count: number;
};

export type HumorMixUpdateInput = {
  id: number;
  caption_count: number;
};

export type TermsFilterState = PaginationQuery;

export type TermManagementRow = {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string | null;
  term: string;
  definition: string;
  example: string;
  priority: number;
  term_type_id: number | null;
  term_type_name: string | null;
};

export type TermMutationInput = {
  id?: number;
  term: string;
  definition: string;
  example: string;
  priority: number;
  term_type_id: number | null;
};

export type CaptionRequestsFilterState = PaginationQuery & {
  activity: "all" | "has_prompt_chains" | "has_responses";
};

export type CaptionRequestManagementRow = {
  id: number;
  created_datetime_utc: string;
  profile_id: string;
  profile_email: string | null;
  profile_name: string | null;
  image_id: string;
  image_url: string | null;
  image_description: string | null;
  prompt_chain_count: number;
  response_count: number;
};

export type CaptionExamplesFilterState = PaginationQuery;

export type CaptionExampleManagementRow = {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string | null;
  image_description: string;
  caption: string;
  explanation: string;
  priority: number;
  image_id: string | null;
  image_url: string | null;
};

export type CaptionExampleMutationInput = {
  id?: number;
  image_description: string;
  caption: string;
  explanation: string;
  priority: number;
  image_id: string | null;
};

export type LlmModelsFilterState = PaginationQuery;

export type LlmModelManagementRow = {
  id: number;
  created_datetime_utc: string;
  name: string;
  llm_provider_id: number;
  llm_provider_name: string | null;
  provider_model_id: string;
  is_temperature_supported: boolean;
};

export type LlmModelMutationInput = {
  id?: number;
  name: string;
  llm_provider_id: number;
  provider_model_id: string;
  is_temperature_supported: boolean;
};

export type LlmProvidersFilterState = PaginationQuery;

export type LlmProviderManagementRow = {
  id: number;
  created_datetime_utc: string;
  name: string;
};

export type LlmProviderMutationInput = {
  id?: number;
  name: string;
};

export type LlmPromptChainsFilterState = PaginationQuery & {
  responseStatus: "all" | "has_responses" | "no_responses";
};

export type LlmPromptChainManagementRow = {
  id: number;
  created_datetime_utc: string;
  caption_request_id: number;
  response_count: number;
  profile_email: string | null;
  image_url: string | null;
};

export type LlmResponsesFilterState = PaginationQuery & {
  llmModelIds: string;
  humorFlavorIds: string;
};

export type LlmResponseManagementRow = {
  id: string;
  created_datetime_utc: string;
  llm_model_response: string | null;
  processing_time_seconds: number;
  llm_model_id: number;
  llm_model_name: string | null;
  profile_id: string;
  profile_email: string | null;
  caption_request_id: number;
  llm_system_prompt: string;
  llm_user_prompt: string;
  llm_temperature: number | null;
  humor_flavor_id: number;
  humor_flavor_slug: string | null;
  llm_prompt_chain_id: number | null;
  humor_flavor_step_id: number | null;
  humor_flavor_step_order: number | null;
  humor_flavor_step_description: string | null;
};

export type AllowedSignupDomainsFilterState = PaginationQuery;

export type AllowedSignupDomainManagementRow = {
  id: number;
  created_datetime_utc: string;
  apex_domain: string;
};

export type AllowedSignupDomainMutationInput = {
  id?: number;
  apex_domain: string;
};

export type WhitelistedEmailsFilterState = PaginationQuery;

export type WhitelistedEmailManagementRow = {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string | null;
  email_address: string;
};

export type WhitelistedEmailMutationInput = {
  id?: number;
  email_address: string;
};

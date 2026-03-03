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

export interface HmRegistration {
  id: string;
  name: string;
  school_type: string;
  school_code: string;
  school_name: string;
  phone_number: string;
  user_id: string;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  school_name: string;
  class: string;
  roll_number: string | null;
  gender: string | null;
  phone_number: string | null;
  user_id: string;
  created_at: string;
}

export interface Exam {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  user_id: string;
  created_at: string;
}

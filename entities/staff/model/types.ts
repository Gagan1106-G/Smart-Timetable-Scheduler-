export interface StaffMember {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
  teachingStaff: StaffMember[];
  nonTeachingStaff: StaffMember[];
}

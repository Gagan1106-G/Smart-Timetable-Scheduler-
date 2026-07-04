export interface Resource {
  id: string;
  name: string;
  type: 'Room' | 'Equipment' | 'StudentGroup';
  capacity?: number;
}

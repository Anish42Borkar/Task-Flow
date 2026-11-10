import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class ReorderTasksDto {
  @IsArray()
  @IsNotEmpty()
  @IsUUID('4', { each: true, message: 'Each item in orderedTaskIds must be a valid UUID' })
  orderedTaskIds: string[];
}

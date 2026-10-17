import { registerDecorator, ValidationOptions } from 'class-validator';
import { isValidPhone } from '../utils/phone';

/** Valid Indian mobile number (see utils/phone). */
export function IsPhone(options?: ValidationOptions) {
  return (target: object, propertyName: string) =>
    registerDecorator({
      name: 'isPhone',
      target: target.constructor,
      propertyName,
      options: { message: 'phone must be a valid 10-digit mobile number', ...options },
      validator: { validate: (value: unknown) => typeof value === 'string' && isValidPhone(value) },
    });
}

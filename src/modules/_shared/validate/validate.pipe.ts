import { BadRequestException } from '@nestjs/common';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'NameValidator', async: false })
export class NameValidator implements ValidatorConstraintInterface {
    validate(value: string, args: ValidationArguments) {
        const unicodeVietnameseRegex = /^[\p{L}\s]+$/u;
        return unicodeVietnameseRegex.test(value);
    }

    defaultMessage(args: ValidationArguments) {
        return 'Tên chỉ được chứa chữ cái và khoảng trắng';
    }
}

@ValidatorConstraint({ name: 'DateValidator', async: false })
export class DateValidator implements ValidatorConstraintInterface {
    validate(value: Date, args: ValidationArguments) {
        const currentDate = new Date();
        return new Date(value) <= currentDate;
    }

    defaultMessage(args: ValidationArguments) {
        return 'Ngày không được vượt quá ngày hiện tại';
    }
}

@ValidatorConstraint({ name: 'CmtValidator', async: false })
export class CmtValidator implements ValidatorConstraintInterface {
    validate(value: string, args: ValidationArguments) {
        return /^\d{9}$|^\d{12}$/.test(value);
    }

    defaultMessage(args: ValidationArguments) {
        return 'CMT phải là chuỗi gồm 9 hoặc 12 chữ số';
    }
}

@ValidatorConstraint({ name: 'DateOfBirthValidator', async: false })
export class DateOfBirthValidator implements ValidatorConstraintInterface {
    validate(value: Date, args: ValidationArguments) {
        const currentDate = new Date();
        const birthDate = new Date(value);
        const age = currentDate.getFullYear() - birthDate.getFullYear();
        const isOldEnough = age > 15 || (age === 15 && birthDate <= currentDate);

        return birthDate <= currentDate && isOldEnough;
    }

    defaultMessage(args: ValidationArguments) {
        return 'Ngày sinh không được vượt quá ngày hiện tại và tuổi phải ít nhất là 15';
    }
}

@ValidatorConstraint({ name: 'PhoneValidator', async: false })
export class PhoneValidator implements ValidatorConstraintInterface {
    validate(value: string, args: ValidationArguments) {
        const phoneRegex = /^(?:\+?(\d{1,3}))?[\s-]?\(?(\d{2,3})\)?[\s-]?(\d{3})[\s-]?(\d{3,4})$/;

        if (!phoneRegex.test(value)) {
            throw new BadRequestException('Số điện thoại không hợp lệ');
        }
        return true;
    }
    defaultMessage(args: ValidationArguments) {
        return 'Số điện thoại phải có định dạng hợp lệ (ví dụ: +84-123-456-7890)';
    }
}

@ValidatorConstraint({ name: 'EndDateValidator', async: false })
export class EndDateValidator implements ValidatorConstraintInterface {
    validate(endDate: Date, args: ValidationArguments) {
        const startDate = args.object['startDate'];
        if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
            return false;
        }

        return true;
    }
    defaultMessage(args: ValidationArguments): string {
        return 'End date must be greater than start date';
    }
}
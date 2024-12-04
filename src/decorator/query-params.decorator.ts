import { ApiQuery } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export function PaginatedQuery() {
    return applyDecorators(
        ApiQuery({
            name: 'page',
            description: 'Page number for pagination',
            required: false,
            type: Number,
            example: 1,
        }),
        ApiQuery({
            name: 'limit',
            description: 'Number of records per page',
            required: false,
            type: Number,
            example: 10,
        }),
        ApiQuery({
            name: 'qs',
            description: 'Search query string',
            required: false,
            type: String,
            example: '',
        }),
    );
}

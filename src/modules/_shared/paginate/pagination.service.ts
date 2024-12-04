import { Injectable } from '@nestjs/common';
import aqp from 'api-query-params';

@Injectable()
export class PaginationService {
    async getPagination<T>(
        data: T[],
        currentPage: number,
        limit: number,
        qs: string
    ) {
        const { filter, sort, population } = aqp(qs);

        let filteredData = data;

        // Lọc dữ liệu theo filter
        if (filter) {
            filteredData = filteredData.filter(item => {
                return Object.keys(filter).every(key => {
                    return item[key] === filter[key];
                });
            });
        }

        // Tính toán phân trang
        const totalItems = filteredData.length;
        const offset = (+currentPage - 1) * (+limit);
        const defaultLimit = +limit || 10;
        const totalPages = Math.ceil(totalItems / defaultLimit);

        // Cắt mảng dữ liệu theo phân trang
        const paginatedData = filteredData.slice(offset, offset + defaultLimit);

        return {
            meta: {
                current: currentPage,
                pageSize: limit,
                pages: totalPages,
                total: totalItems
            },
            result: paginatedData
        };
    }
}


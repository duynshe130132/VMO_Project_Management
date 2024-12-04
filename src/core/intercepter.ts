import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE } from '../decorator/response-message.decorator';

export interface Response<T> { //định dạng dữ liệu trả về client
    statusCode: number;
    message?: string;
    data: T;
}

@Injectable()
export class TransformInterceptor<T> // xử lý và biến đổi dữ liệu / T: dữ liệu tổng quát
    implements NestInterceptor<T, Response<T>> {
    constructor(private reflector: Reflector) {
    }
    intercept(
        context: ExecutionContext, // thông qua ngữ cảnh thực thi
        next: CallHandler //handler cho rq tiếp theo
    ): Observable<Response<T>> {
        return next
            .handle() // trả về 1 Observable
            .pipe(map(data => ({ // biến đổi dữ liệu observable
                statusCode: context.switchToHttp().getResponse().statusCode,
                message: this.reflector.get<string>(RESPONSE_MESSAGE, context.getHandler()) || '',
                data: data
            })));
    }
}
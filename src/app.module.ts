import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './modules/users/users.Module';
import { DepartmentsModule } from './modules/departments/departments.Module';
import { PermissionsModule } from './modules/permissions/permissions.Module';
import { AuthModule } from './modules/auth/auth.Module';
import { RolesModule } from './modules/roles/roles.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ProjecttypesModule } from './modules/projecttypes/projecttypes.module';
import { CustomersModule } from './modules/customers/customers.module';
import { TechnologiesModule } from './modules/technologies/technologies.module';
import { StatusModule } from './modules/status/status.module';
import { softDeletePlugin } from 'soft-delete-plugin-mongoose';
import { ExportExcelModule } from './export-excel/export-excel.module';

@Module({
  imports: [MongooseModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: async (configService: ConfigService) => ({
      uri: configService.get<string>('MONGO_URL'),
      connectionFactory: (connection) => {
        connection.plugin(softDeletePlugin);
        return connection;
      }
    }),
    inject: [ConfigService],
  }),
  ConfigModule.forRoot({
    envFilePath: '.env',
    isGlobal: true
  }),
    UsersModule,
    DepartmentsModule,
    PermissionsModule,
    AuthModule,
    RolesModule,
    ProjectsModule,
    ProjecttypesModule,
    CustomersModule,
    TechnologiesModule,
    StatusModule,
    ExportExcelModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

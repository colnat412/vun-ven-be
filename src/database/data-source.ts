import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { databaseConfig } from './database-options';

export default new DataSource(databaseConfig(process.env));

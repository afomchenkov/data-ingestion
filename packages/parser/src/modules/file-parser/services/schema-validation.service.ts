import { Injectable, Logger } from '@nestjs/common';
import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { DataSchemaService } from '@data-ingestion/shared';
import { parseISO, formatISO } from 'date-fns';

@Injectable()
export class SchemaValidationService {
  private readonly logger = new Logger(SchemaValidationService.name);
  private readonly ajv: Ajv;
  private validator: ValidateFunction | null = null;

  constructor(readonly schemaService: DataSchemaService) {
    this.ajv = new Ajv({
      allErrors: true,
      coerceTypes: false,
      removeAdditional: false,
      useDefaults: true,
      strictSchema: false,
    });
    addFormats(this.ajv);

    // trim the string
    this.ajv.addKeyword({
      keyword: 'trimString',
      modifying: true,
      schema: false,
      validate(_schema, data, _parentSchema, dataCxt) {
        if (typeof data === 'string') {
          (dataCxt?.parentData as any)[dataCxt?.parentDataProperty!] = data.trim();
        }
        return true;
      },
    });

    // parse the date string to ISO8601 format
    this.ajv.addKeyword({
      keyword: 'normalizeDate',
      modifying: true,
      schema: false,
      validate(_schema: any, data: any, _parentSchema, dataCxt) {
        if (typeof data === 'string') {
          try {
            const parsed = parseISO(data.trim());
            (dataCxt?.parentData as any)[dataCxt?.parentDataProperty!] = formatISO(parsed);
            return true;
          } catch {
            return false;
          }
        }
        return true;
      },
    });
  }

  async loadSchema(schemaId: string): Promise<Record<string, any>> {
    this.logger.log(`Loading schema: ${schemaId}`);

    const schemaDefinition = await this.schemaService.findOne(schemaId);
    if (!schemaDefinition) {
      throw new Error(`Schema not found: ${schemaId}`);
    }

    const schema = {
      ...schemaDefinition.schema,
      additionalProperties:
        schemaDefinition.schema.additionalProperties ?? false,
    };

    this.logger.log(`Schema loaded: ${JSON.stringify(schema)}`);

    this.validator = this.ajv.compile(schema);

    const uniqueField = schemaDefinition.schema['x-unique'] || null;
    this.logger.log(`Unique field: [${uniqueField}]`);

    return {
      uniqueField,
      schema,
    };
  }

  validate(data: Record<string, any>): boolean {
    if (!this.validator) {
      throw new Error('Schema not loaded');
    }
    const isValid = this.validator(data);

    if (!isValid) {
      this.logger.debug(`Validation failed for: ${JSON.stringify(data)}`);
      this.logger.debug(`Errors: ${JSON.stringify(this.validator.errors)}`);
    }

    return isValid;
  }

  getErrors() {
    return this.validator?.errors;
  }
}

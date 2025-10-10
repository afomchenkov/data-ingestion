import { Injectable, Logger } from '@nestjs/common';
import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { DataSchemaService } from '@data-ingestion/shared';

// parses the data and validates it against the schema
// loads and compiles the schema
// validates the data
// returns invalid records or null if all records are valid

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

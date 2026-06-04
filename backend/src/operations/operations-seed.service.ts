import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CHILDREN_CHOIR_UNIT_SEED,
  SYSTEM_OPERATION_TEMPLATES,
} from './operations.constants';
import { leadershipPositionsForUnit } from '../operational-units/operational-unit.constants';

@Injectable()
export class OperationsSeedService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedChildrenChoirUnit();
    await this.seedTemplates();
  }

  private async seedChildrenChoirUnit() {
    const ministry = await this.prisma.ministry.findUnique({
      where: { code: CHILDREN_CHOIR_UNIT_SEED.ministryCode },
    });
    if (!ministry) return;

    const unit = await this.prisma.operationalUnit.upsert({
      where: {
        ministryId_code: {
          ministryId: ministry.id,
          code: CHILDREN_CHOIR_UNIT_SEED.code,
        },
      },
      create: {
        ministryId: ministry.id,
        code: CHILDREN_CHOIR_UNIT_SEED.code,
        name: CHILDREN_CHOIR_UNIT_SEED.name,
        description: CHILDREN_CHOIR_UNIT_SEED.description,
        type: CHILDREN_CHOIR_UNIT_SEED.type,
        isActive: true,
        settings: { create: {} },
      },
      update: {
        name: CHILDREN_CHOIR_UNIT_SEED.name,
        isActive: true,
      },
    });

    for (const p of leadershipPositionsForUnit('CHOIR')) {
      await this.prisma.operationalUnitLeadershipPosition.upsert({
        where: {
          operationalUnitId_name: {
            operationalUnitId: unit.id,
            name: p.name,
          },
        },
        create: {
          operationalUnitId: unit.id,
          name: p.name,
          description: p.description,
          isSystem: p.isSystem,
        },
        update: { isActive: true },
      });
    }
  }

  private async seedTemplates() {
    for (const tpl of SYSTEM_OPERATION_TEMPLATES) {
      const template = await this.prisma.operationTemplate.upsert({
        where: { code: tpl.code },
        create: {
          code: tpl.code,
          name: tpl.name,
          type: tpl.type,
          description: tpl.description,
          isSystem: true,
          isActive: true,
        },
        update: {
          name: tpl.name,
          description: tpl.description,
          isActive: true,
        },
      });

      for (const req of tpl.requirements) {
        const existing = await this.prisma.templateAssignmentRequirement.findFirst({
          where: {
            templateId: template.id,
            assignmentType: req.assignmentType,
          },
        });
        if (existing) {
          await this.prisma.templateAssignmentRequirement.update({
            where: { id: existing.id },
            data: { quantity: req.quantity, required: req.required ?? true },
          });
        } else {
          await this.prisma.templateAssignmentRequirement.create({
            data: {
              templateId: template.id,
              assignmentType: req.assignmentType,
              quantity: req.quantity,
              required: req.required ?? true,
            },
          });
        }
      }
    }
  }
}

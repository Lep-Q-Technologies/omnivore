import { Module } from '@nestjs/common'

import { RepositoriesModule } from '../repositories/repositories.module'
import { LabelResolver } from './label.resolver'
import { LabelService } from './label.service'

@Module({
  imports: [
    RepositoriesModule, // Access to ILabelRepository, IEntityLabelRepository, and ILibraryItemRepository
  ],
  providers: [LabelService, LabelResolver],
  exports: [LabelService],
})
export class LabelModule {}

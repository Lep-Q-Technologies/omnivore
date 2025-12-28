import { UseGuards } from '@nestjs/common'
import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { DeleteResult } from '../library/dto/library-inputs.type'
import { LibraryItem } from '../library/dto/library-item.type'
import { LibraryItemEntity } from '../library/entities/library-item.entity'
import { CurrentUser } from '../user/decorators/current-user.decorator'
import { User } from '../user/entities/user.entity'
import { Highlight, HighlightsConnection } from './dto/highlight.type'
import {
  CreateHighlightInput,
  UpdateHighlightInput,
} from './dto/highlight-inputs.type'
import { HighlightColor, HighlightEntity } from './entities/highlight.entity'
import { HighlightService } from './highlight.service'

/**
 * Highlight with optional eager-loaded library item relation
 * Used for field resolver typing
 */
interface HighlightWithLibraryItem
  extends Omit<HighlightEntity, 'libraryItem'> {
  libraryItem?: LibraryItemEntity | null
}

@Resolver(() => Highlight)
export class HighlightResolver {
  constructor(private readonly highlightService: HighlightService) {}

  // ==================== QUERIES ====================

  @Query(() => [Highlight], {
    description: 'Get all highlights for a library item',
  })
  @UseGuards(JwtAuthGuard)
  async highlights(
    @CurrentUser() user: User,
    @Args('libraryItemId', {
      type: () => String,
      description: 'Library item ID',
    })
    libraryItemId: string,
  ): Promise<Highlight[]> {
    const entities = await this.highlightService.findByLibraryItem(
      user.id,
      libraryItemId,
    )

    return entities.map(mapEntityToGraph)
  }

  @Query(() => Highlight, {
    nullable: true,
    description: 'Get a single highlight by ID',
  })
  @UseGuards(JwtAuthGuard)
  async highlight(
    @CurrentUser() user: User,
    @Args('id', { type: () => String, description: 'Highlight ID' })
    id: string,
  ): Promise<Highlight | null> {
    const entity = await this.highlightService.findById(user.id, id)

    return entity ? mapEntityToGraph(entity) : null
  }

  @Query(() => HighlightsConnection, {
    description:
      'Get all highlights for the current user across all library items',
  })
  @UseGuards(JwtAuthGuard)
  async userHighlights(
    @CurrentUser() user: User,
    @Args('first', {
      type: () => Int,
      nullable: true,
      defaultValue: 50,
      description: 'Number of highlights to return',
    })
    first: number,
    @Args('after', {
      type: () => String,
      nullable: true,
      description: 'Cursor for pagination',
    })
    after?: string,
  ): Promise<HighlightsConnection> {
    const result = await this.highlightService.findAllForUser(
      user.id,
      first,
      after,
    )

    return {
      highlights: result.highlights.map(mapEntityToGraph),
      nextCursor: result.nextCursor,
    }
  }

  // ==================== FIELD RESOLVERS ====================

  @ResolveField(() => LibraryItem, { nullable: true })
  async libraryItem(
    @Parent() highlight: HighlightWithLibraryItem,
  ): Promise<LibraryItem | null> {
    // The libraryItem is already loaded via JOIN in the repository
    const item = highlight.libraryItem

    // Validate required fields exist before returning
    // If library item was deleted or has corrupt data, return null
    if (!item || !item.title || !item.slug || !item.originalUrl) {
      return null
    }

    // GraphQL field resolvers can return entities directly
    // The GraphQL type class will handle computed properties (itemType, etc.)
    return item as unknown as LibraryItem
  }

  // ==================== MUTATIONS ====================

  @Mutation(() => Highlight, {
    description: 'Create a new highlight with optional color',
  })
  @UseGuards(JwtAuthGuard)
  async createHighlight(
    @CurrentUser() user: User,
    @Args('input', {
      type: () => CreateHighlightInput,
      description: 'Highlight creation data',
    })
    input: CreateHighlightInput,
  ): Promise<Highlight> {
    const entity = await this.highlightService.createHighlight(user.id, input)

    return mapEntityToGraph(entity)
  }

  @Mutation(() => Highlight, {
    description: 'Update a highlight (annotation and/or color)',
  })
  @UseGuards(JwtAuthGuard)
  async updateHighlight(
    @CurrentUser() user: User,
    @Args('id', { type: () => String, description: 'Highlight ID' })
    id: string,
    @Args('input', {
      type: () => UpdateHighlightInput,
      description: 'Highlight update data',
    })
    input: UpdateHighlightInput,
  ): Promise<Highlight> {
    const entity = await this.highlightService.updateHighlight(
      user.id,
      id,
      input,
    )

    return mapEntityToGraph(entity)
  }

  @Mutation(() => DeleteResult, {
    description: 'Delete a highlight',
  })
  @UseGuards(JwtAuthGuard)
  async deleteHighlight(
    @CurrentUser() user: User,
    @Args('id', { type: () => String, description: 'Highlight ID' })
    id: string,
  ): Promise<DeleteResult> {
    return await this.highlightService.deleteHighlight(user.id, id)
  }
}

function mapEntityToGraph(entity: any): any {
  return {
    id: entity.id,
    shortId: entity.shortId,
    libraryItemId: entity.libraryItemId,
    libraryItem: entity.libraryItem, // Pass through for field resolver
    quote: entity.quote ?? null,
    prefix: entity.prefix ?? null,
    suffix: entity.suffix ?? null,
    patch: entity.patch ?? null,
    annotation: entity.annotation ?? null,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    sharedAt: entity.sharedAt ?? null,
    highlightPositionPercent: entity.highlightPositionPercent ?? 0,
    highlightPositionAnchorIndex: entity.highlightPositionAnchorIndex ?? 0,
    highlightType: entity.highlightType,
    html: entity.html ?? null,
    color: entity.color ?? HighlightColor.YELLOW,
    representation: entity.representation,
    selectors: entity.selectors ?? {},
    contentVersion: entity.contentVersion ?? null,
  }
}

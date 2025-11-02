import {
  Field,
  Float,
  ID,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql'
import {
  HighlightType,
  RepresentationType,
  HighlightColor,
} from '../entities/highlight.entity'

registerEnumType(HighlightType, {
  name: 'HighlightType',
})

registerEnumType(RepresentationType, {
  name: 'RepresentationType',
})

registerEnumType(HighlightColor, {
  name: 'HighlightColor',
  description: 'Highlight color options',
})

@ObjectType()
export class Highlight {
  @Field(() => ID)
  id!: string

  @Field()
  shortId!: string

  @Field()
  libraryItemId!: string

  @Field({ nullable: true })
  quote?: string | null

  @Field({ nullable: true })
  prefix?: string | null

  @Field({ nullable: true })
  suffix?: string | null

  @Field({ nullable: true })
  patch?: string | null

  @Field({ nullable: true })
  annotation?: string | null

  @Field(() => Date)
  createdAt!: Date

  @Field(() => Date)
  updatedAt!: Date

  @Field(() => Date, { nullable: true })
  sharedAt?: Date | null

  @Field(() => Float)
  highlightPositionPercent!: number

  @Field(() => Int)
  highlightPositionAnchorIndex!: number

  @Field(() => HighlightType)
  highlightType!: HighlightType

  @Field({ nullable: true })
  html?: string | null

  @Field(() => HighlightColor)
  color!: HighlightColor

  @Field(() => RepresentationType)
  representation!: RepresentationType

  @Field(() => String, {
    description:
      'JSON-serialized anchored selectors for robust text positioning',
  })
  selectors!: string

  @Field(() => String, {
    nullable: true,
    description: 'Optional content version/hash for tracking',
  })
  contentVersion?: string | null
}

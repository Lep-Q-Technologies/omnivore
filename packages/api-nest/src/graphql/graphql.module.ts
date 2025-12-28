import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ModuleRef } from '@nestjs/core'
import { GraphQLModule } from '@nestjs/graphql'
import { Request, Response } from 'express'
import { GraphQLJSON } from 'graphql-scalars'
import { resolve } from 'path'

import { EnvVariables } from '../config/env-variables'
import { RepositoriesModule } from '../repositories/repositories.module'
import { User } from '../user/entities/user.entity'
import { AuthenticatedRequest, DataLoaderFactory } from './dataloader.service'

/**
 * GraphQL context interface
 */
interface GraphQLContext {
  req: AuthenticatedRequest
  res: Response
  user?: User
  dataLoaders: ReturnType<DataLoaderFactory['create']>
}

@Module({
  imports: [
    RepositoriesModule, // Required for DataLoaderFactory
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule, RepositoriesModule],
      inject: [ConfigService, ModuleRef],
      useFactory: async (
        configService: ConfigService,
        moduleRef: ModuleRef,
      ) => {
        const isProduction =
          configService.get<string>(EnvVariables.NODE_ENV, 'development') ===
          'production'

        return {
          path: '/api/graphql',
          useGlobalPrefix: false,
          autoSchemaFile: resolve(__dirname, '..', '..', 'schema.graphql'),
          sortSchema: true,
          debug: !isProduction,
          playground: false,
          introspection: !isProduction,
          resolvers: { JSON: GraphQLJSON },
          plugins: isProduction
            ? []
            : [ApolloServerPluginLandingPageLocalDefault({ footer: false })],
          context: async ({
            req,
            res,
          }: {
            req: AuthenticatedRequest
            res: Response
          }): Promise<GraphQLContext> => {
            const request = req ?? ({ headers: {} } as AuthenticatedRequest)
            // Get DataLoaderFactory from module context
            const dataLoaderFactory = moduleRef.get(DataLoaderFactory, {
              strict: false,
            })
            // Create a new DataLoader instance per request (request-scoped)
            // Pass the request object so DataLoader can access user lazily after auth
            const dataLoaders = dataLoaderFactory.create(request)

            return {
              req: request,
              res,
              user: request.user,
              dataLoaders,
            }
          },
        }
      },
    }),
  ],
  providers: [DataLoaderFactory],
  exports: [DataLoaderFactory],
})
export class GraphqlModule {}

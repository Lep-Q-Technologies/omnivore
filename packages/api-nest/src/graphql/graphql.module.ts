import { Module } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { resolve } from 'path'
import { GraphQLJSON } from 'graphql-scalars'
import { EnvVariables } from '../config/env-variables'
import { RepositoriesModule } from '../repositories/repositories.module'
import { DataLoaderFactory } from './dataloader.service'

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
          context: async ({ req, res }: { req: any; res: any }) => {
            const request = req ?? { headers: {} }
            // Get DataLoaderFactory from module context
            const dataLoaderFactory = moduleRef.get(DataLoaderFactory, {
              strict: false,
            })
            // Create a new DataLoader instance per request (request-scoped)
            const dataLoaders = dataLoaderFactory.create(request.user)

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

import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { resolve } from 'path'
import { EnvVariables } from '../config/env-variables'

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
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
          plugins: isProduction
            ? []
            : [ApolloServerPluginLandingPageLocalDefault({ footer: false })],
          context: async ({ req, res }: { req: any; res: any }) => {
            const request = req ?? { headers: {} }
            return { req: request, res, user: request.user }
          },
        }
      },
    }),
  ],
})
export class GraphqlModule {}

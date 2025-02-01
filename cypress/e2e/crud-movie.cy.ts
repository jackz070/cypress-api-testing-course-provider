import 'cypress-ajv-schema-validator'
import type { Movie } from '@prisma/client'
import { generateMovieWithoutId } from '../../src/test-helpers/factories'
import spok from 'cy-spok'
import schema from '../../src/api-docs/openapi.json'
import { retryableBefore } from '../support/retryable-before'
import type { OpenAPIV3_1 } from 'openapi-types'

const typedSchema: OpenAPIV3_1.Document = schema as OpenAPIV3_1.Document

describe('CRUD movie', () => {
  const movie = generateMovieWithoutId()
  const updatedMovie = generateMovieWithoutId()
  const movieProps: Omit<movie, 'id'> = {
    name: spok.string,
    year: spok.number,
    rating: spok.number
  }

  let token: string

  retryableBefore(() => {
    cy.maybeGetToken('token-session').then((t) => {
      token = t
    })
  })

  it('should crud', () => {
    cy.addMovie(token, movie)
      .validateSchema(typedSchema, { endpoint: '/movies', method: 'post' })
      .its('body')
      .should(spok({ status: 200, data: movieProps }))
      .its('data.id')
      .then((id) => {
        cy.getAllMovies(token)
          .validateSchema(typedSchema, { endpoint: '/movies', method: 'get' })
          .its('body')
          .should(
            spok({
              status: 200,
              data: (arr: Movie[]) =>
                arr.map(spok({ id: spok.number, ...movieProps }))
            })
          )

        cy.getMovieById(token, id)
          .validateSchema(typedSchema, {
            endpoint: '/movies/{id}',
            method: 'get'
          })
          .its('body')
          .should(spok({ status: 200, data: movieProps }))
          .its('data.name')
          .then((name) => {
            cy.getMovieByName(token, name).validateSchema(typedSchema, {
              endpoint: '/movies',
              method: 'get'
            })
          })

        cy.updateMovie(token, id, updatedMovie)
          .validateSchema(typedSchema, {
            endpoint: '/movies/{id}',
            method: 'put'
          })
          .its('body')
          .should(spok({ status: 200, data: { ...updatedMovie, id } }))

        cy.deleteMovie(token, id)
          .validateSchema(typedSchema, {
            endpoint: '/movies/{id}',
            method: 'delete',
            status: 200
          })
          .its('body')
          .should(
            spok({ status: 200, message: `Movie ${id} has been deleted` })
          )
        const notFoundId = 99999
        cy.deleteMovie(token, notFoundId, true)
          .validateSchema(typedSchema, {
            endpoint: '/movies/{id}',
            method: 'delete',
            status: 404
          })
          .its('body')
          .should(
            spok({
              status: 404,
              error: `Movie with ID ${notFoundId} not found`
            })
          )
      })
  })
})

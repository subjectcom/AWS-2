/*
 * Copyright (C) 2021 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react'
import {ApolloProvider} from 'react-apollo'
import {render, fireEvent, screen} from '@testing-library/react'
import {mswClient} from '../../../../../../shared/msw/mswClient'
import {mswServer} from '../../../../../../shared/msw/mswServer'
import {AddressBookContainer} from '../AddressBookContainer'
import {handlers} from '../../../../graphql/mswHandlers'

describe('Should load <AddressBookContainer> normally', () => {
  const server = mswServer(handlers)

  beforeAll(() => {
    // eslint-disable-next-line no-undef
    fetchMock.dontMock()
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    // eslint-disable-next-line no-undef
    fetchMock.enableMocks()
    server.close()
  })

  beforeEach(() => {
    window.ENV = {
      current_user_id: 1
    }
  })

  const setup = props => {
    return render(
      <ApolloProvider client={mswClient}>
        <AddressBookContainer open {...props} />
      </ApolloProvider>
    )
  }
  describe('Behaviors', () => {
    it('should render', () => {
      const {container} = setup()
      expect(container).toBeTruthy()
    })

    it('should filter menu by initial context', async () => {
      setup({
        activeCourseFilter: 'course_123'
      })
      const items = await screen.findAllByTestId('address-book-item')
      expect(items.length).toBe(2)
    })

    it('Should load the new courses and students submenu on initial load', async () => {
      setup()
      const items = await screen.findAllByTestId('address-book-item')
      expect(items.length).toBe(2)
      expect(screen.queryByText('Students')).toBeInTheDocument()
      expect(screen.queryByText('Courses')).toBeInTheDocument()
    })

    it('Should load data on initial request', async () => {
      setup()
      let items = await screen.findAllByTestId('address-book-item')
      expect(items.length).toBe(2)
      // open student sub-menu
      fireEvent.mouseDown(items[1])

      items = await screen.findAllByTestId('address-book-item')
      // VErify that all students and backbutton appear
      expect(items.length).toBe(4)
    })

    it('Should load new data when variables changes', async () => {
      setup()
      let items = await screen.findAllByTestId('address-book-item')
      fireEvent.mouseDown(items[1])
      items = await screen.findAllByTestId('address-book-item')
      // Expects there to be 3 users and 1 backbutton
      expect(items.length).toBe(4)
    })

    it('should filter menu when typing', async () => {
      const {container} = setup()
      fireEvent.change(container.querySelector('input'), {target: {value: 'Fred'}})
      const items = await screen.findAllByTestId('address-book-item')
      // Expects The user Fred and a back button
      expect(items.length).toBe(2)
    })

    it('should return to last filter when backing out of search', async () => {
      const {container} = setup()
      let items = await screen.findAllByTestId('address-book-item')
      // open students submenu
      fireEvent.mouseDown(items[1])

      items = await screen.findAllByTestId('address-book-item')
      expect(items.length).toBe(4)
      fireEvent.change(container.querySelector('input'), {target: {value: 'Fred'}})

      items = await screen.findAllByTestId('address-book-item')
      // search results
      expect(items.length).toBe(2)
      fireEvent.mouseDown(items[0])

      items = await screen.findAllByTestId('address-book-item')
      // the student sub-menu
      expect(items.length).toBe(4)
    })

    it('Should clear text field when item is clicked', async () => {
      const {container} = setup()
      let input = container.querySelector('input')
      fireEvent.change(input, {target: {value: 'Fred'}})
      expect(input.value).toBe('Fred')

      const items = await screen.findAllByTestId('address-book-item')
      // Expects Fred and a back button
      expect(items.length).toBe(2)

      fireEvent.mouseDown(items[0])
      input = container.querySelector('input')
      expect(input.value).toBe('')
    })

    it('should navigate through filters', async () => {
      setup()
      // Find initial courses and students sub-menu
      let items = await screen.findAllByTestId('address-book-item')
      expect(items.length).toBe(2)

      // Click courses submenu
      fireEvent.mouseDown(items[0])
      items = await screen.findAllByTestId('address-book-item')
      expect(items.length).toBe(2)

      // Click back button which is always first position in submenu
      fireEvent.mouseDown(items[0])
      items = await screen.findAllByTestId('address-book-item')
      expect(items.length).toBe(2)
    })
  })

  describe('Callbacks', () => {
    it('Should call onSelectedIdsChange when id changes', async () => {
      const onSelectedIdsChangeMock = jest.fn()
      setup({
        onSelectedIdsChange: onSelectedIdsChangeMock
      })
      let items = await screen.findAllByTestId('address-book-item')
      fireEvent.mouseDown(items[1])

      items = await screen.findAllByTestId('address-book-item')
      fireEvent.mouseDown(items[1])

      // Loads once when initially loading the page, and then a second time when a user is selected
      expect(onSelectedIdsChangeMock.mock.calls.length).toBe(2)
      expect(onSelectedIdsChangeMock.mock.calls[0][0][0].name).toEqual('Frederick Dukes')
    })
  })
})

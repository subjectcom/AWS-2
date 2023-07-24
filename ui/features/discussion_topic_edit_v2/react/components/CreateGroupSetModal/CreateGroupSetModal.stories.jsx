/*
 * Copyright (C) 2023 - present Instructure, Inc.
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

import React, {useState, useCallback} from 'react'
import CreateGroupSetModal from './CreateGroupSetModal'

export default {
  title: 'Examples/Discussion Create\\Edit/Components/CreateGroupSetModal',
  component: CreateGroupSetModal,
  argTypes: {},
}

export function Primary() {
  const [color, setColor] = useState(null)

  const onSubmit = useCallback(({groupName: newColor}) => {
    setColor(newColor)
  }, [])

  return (
    <div style={{backgroundColor: color, padding: '100px'}}>
      <CreateGroupSetModal show={true} setShow={() => {}} onSubmit={onSubmit} />
    </div>
  )
}
Primary.args = {}
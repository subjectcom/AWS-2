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

import React, {useCallback, useState} from 'react'
import {useSubmit, useLoaderData, useNavigate} from 'react-router-dom'
import {Button} from '@instructure/ui-buttons'
import {Flex} from '@instructure/ui-flex'
import {Heading} from '@instructure/ui-heading'
import {IconPlusLine} from '@instructure/ui-icons'
import {Text} from '@instructure/ui-text'
import {View} from '@instructure/ui-view'
import ProjectDashboardCard, {PROJECT_CARD_WIDTH, PROJECT_CARD_HEIGHT} from './ProjectDashboardCard'
import {showUnimplemented} from '../shared/utils'
import type {ProjectData} from '../types'
import NamingModal from '../shared/NamingModal'
import {renderCardSkeleton} from '../shared/CardSkeleton'

const ProjectDashboard = () => {
  const navigate = useNavigate()
  const submit = useSubmit()
  const projects = useLoaderData() as ProjectData[]
  const [createModalIsOpen, setCreateModalIsOpen] = useState(false)
  const [renameModalIsOpen, setRenameModalIsOpen] = useState(false)
  const [actionProjectId, setActionProjectId] = useState('')

  const handleDismissCreateModal = useCallback(() => {
    setCreateModalIsOpen(false)
    setRenameModalIsOpen(false)
  }, [])

  const handleCreateClick = useCallback(() => {
    setCreateModalIsOpen(true)
  }, [])

  const handleCreateNewProject = useCallback(
    (f: HTMLFormElement) => {
      setCreateModalIsOpen(false)
      submit(f, {method: 'PUT'})
    },
    [submit]
  )

  const handleRenameProject = useCallback(
    (f: HTMLFormElement) => {
      setRenameModalIsOpen(false)
      submit(f, {method: 'POST', action: 'rename'})
    },
    [submit]
  )

  const handleCardAction = useCallback(
    (projectId: string, action: string) => {
      switch (action) {
        case 'duplicate':
          navigate(`duplicate/${projectId}`)
          break
        case 'edit':
          navigate(`../edit/${projectId}`)
          break
        case 'view':
          navigate(`../view/${projectId}`)
          break
        case 'delete':
          navigate(`delete/${projectId}`)
          break
        case 'rename':
          setActionProjectId(projectId)
          setRenameModalIsOpen(true)
          break
        default:
          showUnimplemented({currentTarget: {textContent: action}})
      }
    },
    [navigate]
  )

  return (
    <>
      <Flex justifyItems="space-between">
        <Flex.Item shouldGrow={true}>
          <Heading level="h1" themeOverride={{h1FontWeight: 700}}>
            Projects
          </Heading>
        </Flex.Item>
        <Flex.Item>
          <Button renderIcon={IconPlusLine} color="primary" onClick={handleCreateClick}>
            Create Project
          </Button>
        </Flex.Item>
      </Flex>
      <View as="div" margin="small 0 large 0">
        <Text size="large">
          Create and share a project of your achievements, work, eduation history, and work
          experience.
        </Text>
      </View>
      <View>
        {projects?.length > 0 ? null : (
          <View as="div" margin="0">
            <Text size="x-small">No projects created</Text>
          </View>
        )}
        <View as="div" margin="small 0">
          {projects && projects.length > 0 ? (
            <Flex gap="medium" wrap="wrap">
              {projects.map(project => (
                <Flex.Item shouldGrow={false} shouldShrink={false} key={project.id}>
                  <View as="div" shadow="resting">
                    <ProjectDashboardCard project={project} onAction={handleCardAction} />
                  </View>
                </Flex.Item>
              ))}
            </Flex>
          ) : (
            renderCardSkeleton(PROJECT_CARD_WIDTH, PROJECT_CARD_HEIGHT)
          )}
        </View>
      </View>
      <NamingModal
        objectType="Project"
        objectId={actionProjectId}
        mode={createModalIsOpen ? 'create' : 'rename'}
        currentName={
          renameModalIsOpen ? projects.find(p => p.id === actionProjectId)?.title : undefined
        }
        open={createModalIsOpen || renameModalIsOpen}
        onDismiss={handleDismissCreateModal}
        onSubmit={createModalIsOpen ? handleCreateNewProject : handleRenameProject}
      />
    </>
  )
}

export default ProjectDashboard

/**

Copyright 2019 Forestry.io Inc

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

import * as React from 'react'
import { Field, Form } from '@tinacms/forms'

import styled, { css, StyledComponent } from 'styled-components'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { AddIcon, DragIcon, ReorderIcon, TrashIcon } from '@tinacms/icons'
import {
  padding,
  color,
  radius,
  font,
  IconButton,
  shadow,
} from '@tinacms/styles'

export interface RelationFieldDefinititon extends Field {
  name: string
  label: string
  component: 'relation'
  fields: Field[]
  data: object[]
  disabled?: boolean
  sortable?: boolean
  multiple?: boolean
  noDataText: string
  itemProps: (
    item: object
  ) => {
    /**
     * The `key` property used to identify entities.
     */
    key: string
    /**
     * The label to be display on the list item.
     */
    label: string
  }
}

export interface RelationProps {
  input: any
  meta: any
  field: RelationFieldDefinititon
  form: any
  tinaForm: Form
}

export const Relation = (props: RelationProps) => {
  if (props.field.multiple) {
    return <MultipleRelations {...props} />
  }

  return <SingleRelation {...props} />
}

Relation.defaultProps = {
  multiple: false,
  itemKey: 'id',
  noDataText: 'There is no data.',
}

const SingleRelation = ({ input, field }: RelationProps) => {
  const options = field.data.map(item => field.itemProps(item))

  React.useEffect(() => {
    input.onChange(options[0].key)
  }, [field.data])

  return (
    <>
      <RelationHeader>
        <FieldLabel>{field.label}</FieldLabel>
      </RelationHeader>
      <RelationBody>
        <Select input={input} field={field} options={options} />
      </RelationBody>
    </>
  )
}

interface MultipleRelationsProps extends RelationProps {
  sortable?: boolean
}

const MultipleRelations = ({ input, field, form }: MultipleRelationsProps) => {
  const [visible, setVisible] = React.useState<boolean>(false)
  const value = input.value || []

  const addRelation = React.useCallback(
    value => {
      form.mutators.insert(field.name, 0, value)
    },
    [field.name, form.mutators]
  )

  const moveArrayItem = React.useCallback(
    result => {
      if (!result.destination || !form) return
      const name = result.type
      form.mutators.move(name, result.source.index, result.destination.index)
    },
    [form]
  )

  return (
    <DragDropContext onDragEnd={moveArrayItem}>
      <RelationHeader>
        <FieldLabel>{field.label}</FieldLabel>
        <IconButton
          primary
          small
          onClick={() => setVisible(!visible)}
          open={visible}
        >
          <AddIcon />
        </IconButton>
        <RelationMenu open={visible}>
          <RelationMenuList>
            {field.data.map(item => {
              const props = field.itemProps(item)
              return (
                <RelationOption
                  key={props.key}
                  onClick={() => {
                    addRelation(props.key)
                    setVisible(false)
                  }}
                >
                  {props.label}
                </RelationOption>
              )
            })}
          </RelationMenuList>
        </RelationMenu>
      </RelationHeader>
      <Droppable droppableId={field.name} type={field.name}>
        {provider => (
          <RelationBody ref={provider.innerRef}>
            {field.data.length === 0 && (
              <EmptyList>{field.noDataText}</EmptyList>
            )}
            {value.map((key: string, index: number) => {
              const item = field.data.find(
                item => field.itemProps(item).key === key
              )
              return (
                <RelationListItem
                  label={item.label}
                  form={form}
                  field={field}
                  index={index}
                  key={key}
                />
              )
            })}
            {provider.placeholder}
          </RelationBody>
        )}
      </Droppable>
    </DragDropContext>
  )
}

interface RelationListItem {
  label: string
  form: Form
  field: RelationFieldDefinititon
  index: number
}

interface Snapshot {
  isDragging: boolean
}

const RelationListItem = ({ label, form, field, index }: RelationListItem) => {
  const removeItem = React.useCallback(() => {
    form.mutators.remove(field.name, index)
  }, [form, field, index])

  return (
    <Draggable
      key={index}
      type={field.name}
      draggableId={`${field.name}.${index}`}
      index={index}
      isDragDisabled={!field.sortable}
    >
      {(provider, snapshot: Snapshot) => (
        <ListItem
          ref={provider.innerRef}
          isDragging={snapshot.isDragging}
          {...provider.draggableProps}
          {...provider.dragHandleProps}
        >
          {field.sortable && <DragHandle />}
          <ItemLabel>
            {label ? label : <Placeholder>Unknown Item</Placeholder>}
          </ItemLabel>
          <DeleteButton onClick={removeItem}>
            <TrashIcon />
          </DeleteButton>
        </ListItem>
      )}
    </Draggable>
  )
}

interface SelectOption {
  key: string | number
  label: string
}

interface SelectProps {
  input: any
  field: RelationFieldDefinititon
  options: SelectOption[]
}

const Select = ({ input, field, options }: SelectProps) => {
  return (
    <SelectElement>
      <select
        id={input.name}
        value={input.value}
        onBlur={input.onChange}
        disabled={field.disabled}
        {...input}
      >
        {options ? (
          options.map(option => (
            <option value={option.key} key={option.key}>
              {option.label}
            </option>
          ))
        ) : (
          <option>{input.value}</option>
        )}
      </select>
    </SelectElement>
  )
}

const SelectElement = styled.div`
  display: block;
  position: relative;

  select {
    display: block;
    font-family: inherit;
    max-width: 100%;
    padding: ${padding('small')};
    border-radius: ${radius('small')};
    background: ${color.grey(0)};
    font-size: ${font.size(2)};
    line-height: 1.35;
    position: relative;
    background-color: ${color.grey()};
    transition: all 85ms ease-out;
    border: 1px solid ${color.grey(2)};
    width: 100%;
    margin: 0;
    appearance: none;
    outline: none;
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
    background-repeat: no-repeat;
    background-position: right 0.7em top 50%;
    background-size: 0.65em auto;
  }
`

const RelationBody: StyledComponent<'div', {}, {}> = styled.div`
  margin-bottom: 1.5rem;
`

const Placeholder: StyledComponent<'div', {}, {}> = styled.div`
  opacity: 0.3;
  text-transform: italic;
`

interface ItemLabelProps {
  error?: string
}

const ItemLabel: StyledComponent<'div', {}, {}> = styled.div<ItemLabelProps>`
  margin: 0;
  font-size: ${font.size(2)};
  font-weight: 500;
  flex: 1 1 auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  align-self: center;
  color: inherit;
  transition: all 85ms ease-out;
  text-align: left;
  padding: 0 0.5rem;
  pointer-events: none;

  ${props =>
    props.error &&
    css`
      color: ${color.error()} !important;
    `};
`

const DragHandle: StyledComponent<'div', {}, {}> = styled(function DragHandle({
  ...styleProps
}) {
  return (
    <div {...styleProps}>
      <DragIcon />
      <ReorderIcon />
    </div>
  )
})`
  margin: 0;
  flex: 0 0 auto;
  width: 2rem;
  position: relative;
  fill: inherit;
  padding: 0.75rem 0;
  transition: all 85ms ease-out;
  svg {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 1.25rem;
    height: 1.25rem;
    transform: translate3d(-50%, -50%, 0);
    transition: all 85ms ease-out;
  }
  svg:last-child {
    opacity: 0;
  }
`

const DeleteButton: StyledComponent<'button', {}, {}> = styled.button`
  text-align: center;
  flex: 0 0 auto;
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: 0.75rem 0.5rem;
  margin: 0;
  transition: all 85ms ease-out;
  &:hover {
    background-color: ${color.grey(2)};
  }
`

interface ListItemProps {
  isDragging?: boolean
}

const ListItem: StyledComponent<'div', {}, {}> = styled.div<ListItemProps>`
  position: relative;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  background-color: white;
  border: 1px solid ${color.grey(2)};
  margin: 0 0 -1px 0;
  overflow: visible;
  line-height: 1.35;
  padding: 0;
  font-size: ${font.size(2)};
  font-weight: 500;

  ${ItemLabel} {
    color: #282828;
    align-self: center;
    max-width: 100%;
  }

  svg {
    fill: ${color.grey(3)};
    width: 1.25rem;
    height: auto;
    transition: fill 85ms ease-out;
  }

  &:hover {
    background-color: #f6f6f9;
    cursor: grab;

    ${ItemLabel} {
      color: #0084ff;
    }
    ${DeleteButton} {
      svg {
        fill: ${color.grey(4)};
      }
      &:hover {
        svg {
          fill: ${color.grey(8)};
        }
      }
    }
    ${DragHandle} {
      svg {
        fill: ${color.grey(8)};
      }
      svg:first-child {
        opacity: 0;
      }
      svg:last-child {
        opacity: 1;
      }
    }
  }

  &:first-child {
    border-radius: 0.25rem 0.25rem 0 0;
  }

  &:nth-last-child(2) {
    border-radius: 0 0 0.25rem 0.25rem;
    &:first-child {
      border-radius: ${radius('small')};
    }
  }

  ${p =>
    p.isDragging &&
    css`
      border-radius: ${radius('small')};
      box-shadow: 0px 2px 3px rgba(0, 0, 0, 0.12);

      svg {
        fill: ${color.grey(8)};
      }
      ${ItemLabel} {
        color: #0084ff;
      }

      ${DragHandle} {
        svg:first-child {
          opacity: 0;
        }
        svg:last-child {
          opacity: 1;
        }
      }
    `};
`

const EmptyList: StyledComponent<'div', {}, {}> = styled.div`
  text-align: center;
  border-radius: ${radius('small')};
  background-color: ${color.grey(2)};
  color: ${color.grey(4)};
  line-height: 1.35;
  padding: 0.75rem 0;
  font-size: ${font.size(2)};
  font-weight: 500;
`

const RelationHeader: StyledComponent<'div', {}, {}> = styled.div`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`

interface FieldLabelProps {
  error?: string
}

const FieldLabel: StyledComponent<'label', {}, {}> = styled.label<
  FieldLabelProps
>`
  margin: 0;
  font-size: ${font.size(1)};
  font-weight: 600;
  flex: 1 1 auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${color.grey(7)};
  transition: all 85ms ease-out;
  text-align: left;

  ${props =>
    props.error &&
    css`
      color: ${color.error()} !important;
    `};
`

interface RelationMenuProps {
  open?: boolean
}

const RelationMenu: StyledComponent<'div', {}, {}> = styled.div<
  RelationMenuProps
>`
  min-width: 12rem;
  border-radius: ${radius()};
  border: 1px solid #efefef;
  display: block;
  position: absolute;
  top: 0;
  right: 0;
  transform: translate3d(0, 0, 0) scale3d(0.5, 0.5, 1);
  opacity: 0;
  pointer-events: none;
  transition: all 150ms ease-out;
  transform-origin: 100% 0;
  box-shadow: ${shadow('big')};
  background-color: white;
  overflow: hidden;
  z-index: 100;
  ${props =>
    props.open &&
    css`
      opacity: 1;
      pointer-events: all;
      transform: translate3d(0, 2.25rem, 0) scale3d(1, 1, 1);
    `};
`

const RelationMenuList: StyledComponent<'div', {}, {}> = styled.div`
  display: flex;
  flex-direction: column;
`

const RelationOption: StyledComponent<'button', {}, {}> = styled.button`
  position: relative;
  text-align: center;
  font-size: ${font.size(0)};
  padding: ${padding('small')};
  font-weight: 500;
  width: 100%;
  background: none;
  cursor: pointer;
  outline: none;
  border: 0;
  transition: all 85ms ease-out;
  &:hover {
    color: ${color.primary()};
    background-color: #f6f6f9;
  }
  &:not(:last-child) {
    border-bottom: 1px solid #efefef;
  }
`

export default {
  name: 'relation',
  Component: Relation,
}

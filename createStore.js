import { useState, useEffect, useLayoutEffect } from 'react'

const isFn = (fn) => typeof fn === 'function'
const effect = typeof window === 'undefined' ? useEffect : useLayoutEffect

const checkKeys = (keys, store, oldStore) => {
  if (keys.length === 0) return true

  if (typeof store === 'object') {
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] in store && store[keys[i]] !== oldStore[keys[i]]) {
        return true
      }
    }
  }

  return false
}

const createActions = (actions, setStore, getStore) => {
  const mappedActions = {}

  if (actions) {
    Object.keys(actions).forEach((key) => {
      if (isFn(actions[key])) {
        mappedActions[key] = actions[key](setStore, getStore)
      }
    })
  }

  return mappedActions
}

const createStore = (initialStore, reducer, initialActions) => {
  let store = initialStore
  const listeners = new Set()

  const setStore = (newStore) => {
    let oldStore = store

    if (reducer) {
      store = reducer(store, newStore)
    } else {
      store = isFn(newStore) ? newStore(store) : newStore
    }

    if (store !== oldStore) {
      listeners.forEach(({ keys, fire }) => {
        if (checkKeys(keys, store, oldStore)) {
          fire(() => store)
        }
      })
    }
  }

  const getStore = () => store

  const actions = createActions(initialActions, setStore, getStore)

  return (...keys) => {
    const [, fire] = useState()
    const listener = {
      keys,
      fire,
    }

    effect(() => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    }, [listener])

    return [store, setStore, actions]
  }
}

export default createStore

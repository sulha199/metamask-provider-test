import { useCallback, useEffect, useState } from 'react'

let isOnLoadValueSet = false;

/**
 * Store to local storage
 */
export const useOnLoadValue= (key: string) => {
  const [value, setValue] = useState(localStorage.getItem(key))

  const updateValue = useCallback((input: string | null) => {
    setValue(input)
    isOnLoadValueSet = input != null;
    if (input != null) {
      localStorage.setItem(key, input)
    }
  }, [key])

  useEffect(() => {
    return () => {
      if (!isOnLoadValueSet) {
        localStorage.removeItem(key)
      }
    }
  })

  return {value, updateValue}
}


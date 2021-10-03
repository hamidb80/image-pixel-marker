export function addToObject(object, key, val) {  // pushes a new value to object[key]
  if (object[key])
    object[key].push(val)
  else
    object[key] = [val]
}
import * as internal from "./internal"

export const InvalidReference = internal.errors.InvalidReference
export type InvalidReference = internal.errors.InvalidReference


/**
 * Finds circular references inside a object with Reference objects.
 * This function assumes all references are valid and point to existing keys so make sure to check all of those before
 * calling this function otherwise it will throw.
 * This function scans recursively all objects, all arrays, all tables for Reference objects (objects containing a `$ref` key).
 *
 * @param object An object to recursively look for circular references
 * @returns All detected circular references
 */
export const getForCircularReferences = internal.circularReferenceChecker.getForCircularReferences;
export const IndirectCircularReference = internal.circularReferenceChecker.IndirectCircularReference;
export const DirectCircularReference = internal.circularReferenceChecker.DirectCircularReference;
export const CircularReference = internal.circularReferenceChecker.DirectCircularReference;
export const ObjectPathCyclicSequence = internal.circularReferenceChecker.ObjectPathCyclicSequence;
export const objectPaths = internal.objectPaths;

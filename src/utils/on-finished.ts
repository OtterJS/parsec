import _onFinished from "on-finished"
import { promisify } from "node:util"

export const onFinished = promisify(_onFinished)
export const isFinished = _onFinished.isFinished

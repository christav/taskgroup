/* eslint-env browser */
'use strict'

const TaskGroup = require('../source/index.js').TaskGroup

const $status = document.createElement('h2')
$status.innerText = 'loaded'
document.body.appendChild($status)

const $performance = document.createElement('button')
$performance.innerText = 'run'
document.body.appendChild($performance)

const $amount = document.createElement('input')
$amount.setAttribute('type', 'number')
$amount.setAttribute('title', 'how many tasks to run')
$amount.value = '50000'
document.body.appendChild($amount)

$performance.onclick = window.performanceTest = function () {
	const amount = Number($amount.value)
	$status.innerText = `running ${amount} tasks!`

	// Prepare
	function createTask (name, value) {
		return function () {
			// $status.innerHTML += value
			return value
		}
	}

	// Create the taskgroup
	const tasks = TaskGroup.create()

	// Add the tasks
	for (let i = 0, n = amount; i < n; ++i) {
		const name = 'Task ' + i
		const value = 'Value ' + i
		const task = createTask(name, value)
		tasks.addTask(name, task)
	}

	// Listen for completion
	tasks.done(function () {
		$status.innerText = `ran ${amount} tasks`
	})

	// Start the taskgroup
	tasks.run()
}

/* eslint no-extra-parens:0 func-style:0 */
// Imports
const {BaseInterface} = require('./interface')
const {queue, domain} = require('./util')
const ambi = require('ambi')
const extendr = require('extendr')
const eachr = require('eachr')

/**
Our Task Class

Available configuration is documented in {@link Task#setConfig}.

Available events:

- `pending()` - emitted when execution has been triggered
- `running()` - emitted when the method starts execution
- `failed(error)` - emitted when execution exited with a failure
- `passed()` - emitted when execution exited with a success
- `completed(error, ...resultArguments)` - emitted when execution exited, `resultArguments` are the result arguments from the method
- `error(error)` - emtited if an unexpected error occurs without ourself
- `done(error, ...resultArguments)` - emitted when either execution completes (the `completed` event) or when an unexpected error occurs (the `error` event)

Available internal statuses:

- `'created'` - execution has not yet started
- `'pending'` - execution has been triggered
- `'running'` - execution of our method has begun
- `'failed'` - execution of our method has failed
- `'passed'` - execution of our method has succeeded
- `'destroyed'` - we've been destroyed and can no longer execute

Example:

``` javascript
var Task = require('taskgroup').Task
var task

task = new Task('my synchronous task', function(){
	return 5
}).done(console.info).run()  // [null, 5]

task = new Task('my asynchronous task', function(complete){
	complete(null, 5)
}).done(console.info).run()  // [null, 5]

task = new Task('my task that returns an error', function(){
	var error = new Error('deliberate error')
	return error
}).done(console.info).run()  // [Error('deliberator error')]

task = new Task('my task that passes an error', function(complete){
	var error = new Error('deliberate error')
	complete(error)
}).done(console.info).run()  // [Error('deliberator error')]
```

@class Task
@extends BaseInterface
@constructor
@access public
*/
class Task extends BaseInterface {

	// ===================================
	// Typing Helpers

	/**
	The type of our class.

	Used for the purpose of duck typing
	which is needed when working with node virtual machines
	as instanceof will not work in those environments.

	@type {String}
	@default 'task'
	@access private
	*/
	get type () { return 'task' }

	/**
	A helper method to check if the passed argument is a {Task} via instanceof and duck typing.
	@param {Task} item - The possible instance of the {Task} that we want to check
	@return {Boolean} Whether or not the item is a {Task} instance.
	@static
	@access public
	*/
	static isTask (item) {
		return (item && item.type === 'task') || (item instanceof this)
	}


	// ===================================
	// Accessors

	/**
	An {Array} of the events that we may emit.
	@type {Array}
	@default ['events', 'error', 'pending', 'running', 'failed', 'passed', 'completed', 'done', 'destroyed']
	@access protected
	*/
	get events () {
		return ['events', 'error', 'pending', 'running', 'failed', 'passed', 'completed', 'done', 'destroyed']
	}


	// -----------------------------------
	// State Accessors

	/**
	The first {Error} that has occured.
	@type {Error}
	@access protected
	*/
	get error () { return this.state.error }

	/**
	A {String} containing our current status. See our {Task} description for available values.
	@type {String}
	@access protected
	*/
	get status () { return this.state.status }

	/**
	An {Array} representing the returned result or the passed {Arguments} of our method.
	The first item in the array should be the {Error} if it exists.
	@type {Array}
	@access protected
	*/
	get result () { return this.state.result }


	// ---------------------------------
	// Status Accessors

	/**
	Have we started execution yet?
	@type {Boolean}
	@access private
	*/
	get started () {
		return this.state.status !== 'created'
	}

	/**
	Have we finished execution yet?
	@type {Boolean}
	@access private
	*/
	get exited () {
		switch ( this.state.status ) {
			case 'failed':
			case 'passed':
			case 'destroyed':
				return true

			default:
				return false
		}
	}

	/**
	Have we completed execution yet?
	@type {Boolean}
	@access private
	*/
	get completed () {
		switch ( this.state.status ) {
			case 'failed':
			case 'passed':
				return true

			default:
				return false
		}
	}

	// ---------------------------------
	// State Changers

	/**
	Reset the results.
	At this point this method is internal, as it's functionality may change in the future, and it's outside use is not yet confirmed. If you need such an ability, let us know via the issue tracker.
	@chainable
	@returns {this}
	@access private
	*/
	resetResults () {
		this.state.result = []
		return this
	}

	/**
	Clear the domain
	@chainable
	@returns {this}
	@access private
	*/
	clearDomain () {
		const taskDomain = this.state.taskDomain
		if ( taskDomain ) {
			taskDomain.exit()
			taskDomain.removeAllListeners()
			this.state.taskDomain = null
		}
		return this
	}


	// ===================================
	// Initialization

	/**
	Initialize our new {Task} instance. Forwards arguments onto {@link Task#setConfig}.
	@access public
	*/
	constructor (...args) {
		// Initialise BaseInterface
		super()

		// State defaults
		extendr.defaults(this.state, {
			name: `${this.type} ${Math.random()}`,
			error: null,
			status: 'created'
		})

		// Configuration defaults
		extendr.defaults(this.config, {
			// Standard
			destroyOnceDone: true,
			sync: false,
			parent: null,

			// Unique to Task
			method: null,
			errorOnExcessCompletions: true,
			ambi: true,
			domain: true,
			args: null
		})

		// Apply user configuration
		this.setConfig(...args)
	}

	/**
	Set the configuration for our instance.

	@param {Object} [config]

	@param {String} [config.name] - What we would like our name to be, useful for debugging.
	@param {Function} [config.done] - Passed to {@link Task#onceDone} (aliases are `onceDone`, and `next`)
	@param {Function} [config.whenDone] - Passed to {@link Task#whenDone}
	@param {Object} [config.on] - A map of event names linking to listener functions that we would like bounded via {EventEmitter.on}.
	@param {Object} [config.once] - A map of event names linking to listener functions that we would like bounded via {EventEmitter.once}.

	@param {Boolean} [config.destroyOnceDone=true] - Whether or not to automatically destroy the task once it's done to free up resources
	@param {Boolean} [config.sync=false] - Whether or not we should execute certain calls asynchronously (set to `false`) or synchronously (set to `true`).
	@param {TaskGroup} [config.parent] - A parent {@link TaskGroup} that we may be attached to.

	@param {Function} [config.method] - The {Function} to execute for our {Task}.
	@param {Boolean} [config.errorOnExcessCompletions=true] - Whether or not to error if the task completes more than once
	@param {Boolean} [config.ambi=true] - Whether or not to use bevry/ambi to determine if the method is asynchronous or synchronous and execute it appropriately.
	@param {Boolean} [config.domain=true] - Whether or not to wrap the task execution in a domain to attempt to catch background errors (aka errors that are occuring in other ticks than the initial execution).
	@param {Array} [config.args] - Arguments that we would like to forward onto our method when we execute it.

	@chainable
	@returns {this}
	@access public
	*/
	setConfig (...args) {
		const opts = {}

		// Extract the configuration from the arguments
		args.forEach(function (arg) {
			if ( arg == null )  return
			const type = typeof arg
			switch ( type ) {
				case 'string':
					opts.name = arg
					break
				case 'function':
					opts.method = arg
					break
				case 'object':
					extendr.deep(opts, arg)
					break
				default: {
					const error = new Error(`Unknown argument type of [${type}] given to Task::setConfig()`)
					throw error
				}
			}
		})

		// Apply the configuration directly to our instance
		eachr(opts, (value, key) => {
			if ( value == null )  return
			switch ( key ) {
				case 'on':
					eachr(value, (value, key) => {
						if ( value ) this.on(key, value)
					})
					break

				case 'once':
					eachr(value, (value, key) => {
						if ( value ) this.once(key, value)
					})
					break

				case 'whenDone':
					this.whenDone(value)
					break

				case 'onceDone':
				case 'done':
				case 'next':
					this.onceDone(value)
					break

				default:
					this.config[key] = value
					break
			}
		})

		// Chain
		return this
	}


	// ===================================
	// Workflow

	/**
	When Done Promise.
	Fires the listener, either on the next tick if we are already done, or if not, each time the `done` event fires.
	@param {Function} listener - The {Function} to attach or execute.
	@chainable
	@returns {this}
	@access public
	*/
	whenDone (listener) {
		if ( this.completed ) {
			// avoid zalgo
			this.queue(() => {
				const result = this.state.result || []
				listener.apply(this, result)
			})
		}
		else {
			super.whenDone(listener)
		}

		// Chain
		return this
	}

	/**
	Once Done Promise.
	Fires the listener once, either on the next tick if we are already done, or if not, each time the `done` event fires.
	@param {Function} listener - The {Function} to attach or execute.
	@chainable
	@returns {this}
	@access public
	*/
	onceDone (listener) {
		if ( this.completed ) {
			// avoid zalgo
			this.queue(() => {
				const result = this.state.result || []
				listener.apply(this, result)
			})
		}
		else {
			super.onceDone(listener)
		}

		// Chain
		return this
	}

	/**
	What to do when our task method completes.
	Should only ever execute once, if it executes more than once, then we error.
	@param {Arguments} args - The arguments that will be applied to the {::result} variable. First argument is the {Error} if it exists.
	@chainable
	@returns {this}
	@access private
	*/
	itemCompletionCallback (...args) {
		// Store the first error
		let error = this.state.error
		if ( args[0] && !error ) {
			this.state.error = error = args[0]
		}

		// Complete for the first (and hopefully only) time
		if ( !this.exited ) {
			// Apply the result if it exists
			if ( args.length !== 0 ) this.state.result = args
		}

		// Finish up
		this.finish()

		// Chain
		return this
	}

	/**
	@NOTE Perhaps at some point, we can add abort/exit functionality, but these things have to be considered:
	What will happen to currently running items?
	What will happen to remaining items?
	Should it be two methods? .halt() and .abort(error?)
	Should it be a state?
	Should it alter the state?
	Should it clear or destroy?
	What is the definition of pausing with this?
	Perhaps we need to update the definition of pausing to be halted instead?
	How can we apply this to Task and TaskGroup consistently?
	@access private
	@returns {void}
	*/
	abort () {
		throw new Error('not yet implemented')
	}

	/**
	Set our task to the completed state.
	@chainable
	@returns {this}
	@access private
	*/
	finish () {
		const error = this.state.error

		// Complete for the first (and hopefully only) time
		if ( !this.exited ) {
			// Set the status and emit depending on success or failure status
			const status = error ? 'failed' : 'passed'
			this.state.status = status
			this.emit(status, error)

			// Notify our listeners we have completed
			const args = this.state.result || []
			this.emit('completed', ...args)

			// Prevent the error from persisting
			this.state.error = null

			// Destroy if desired
			if ( this.config.destroyOnceDone ) {
				this.destroy()
			}
		}

		// Error as we have already completed before
		else if ( this.config.errorOnExcessCompletions ) {
			const completedError = new Error(`The task [${this.names}] just completed, but it had already completed earlier, this is unexpected.`)
			this.emit('error', completedError)
		}

		// Chain
		return this
	}

	/**
	Destroy ourself and prevent ourself from executing ever again.
	@chainable
	@returns {this}
	@access public
	*/
	destroy () {
		// Once finished running, destroy - we don't want to destroy earlier, because @TODO find out why
		this.done(() => {
			// Are we already destroyed?
			if ( this.state.status === 'destroyed' )  return

			// Update our status and notify our listeners
			this.state.status = 'destroyed'
			this.emit('destroyed')

			// Clear results
			// this.resetResults()
			// ^ don't bother, nothing listens to this, not essential

			// Remove all listeners
			this.removeAllListeners()

			// Clear the domain
			this.clearDomain()
		})

		// Chain
		return this
	}

	/**
	Fire the task method with our config arguments and wrapped in a domain.
	@chainable
	@returns {this}
	@access private
	*/
	fire () {
		// Prepare
		const args = (this.config.args || []).slice()
		let taskDomain = this.state.taskDomain
		const useDomains = this.config.domain !== false
		const exitMethod = this.itemCompletionCallback.bind(this)
		let method = this.config.method

		// Check that we have a method to fire
		if ( !method ) {
			const error = new Error(`The task [${this.names}] failed to run as no method was defined for it.`)
			this.emit('error', error)
			return this
		}

		// Bind method
		method = method.bind(this)

		// Prepare the task domain if it doesn't already exist
		if ( useDomains && domain && !taskDomain ) {
			// Setup the domain
			this.state.taskDomain = taskDomain = domain.create()
			taskDomain.on('error', exitMethod)
		}

		// Domains, as well as process.nextTick, make it so we can't just use exitMethod directly
		// Instead we cover it up like so, to ensure the domain exits, as well to ensure the arguments are passed
		const completeMethod = (...args) => {
			if ( this.config.sync || taskDomain ) {
				this.clearDomain()
				taskDomain = null
				exitMethod(...args)
			}
			else {
				// Use the next tick workaround to escape the try...catch scope
				// Which would otherwise catch errors inside our code when it shouldn't therefore suppressing errors
				// @TODO add test for this, originally used process.nextTick, changed to queue, hopefully it still does the same
				queue(function () {
					exitMethod(...args)
				})
			}
		}

		// Our fire function that will be wrapped in a domain or executed directly
		const fireMethod = () => {
			// Execute with ambi if appropriate
			if ( this.config.ambi !== false ) {
				ambi(method, ...args)
			}

			// Otherwise execute directly if appropriate
			else {
				method(...args)
			}
		}

		// Add the competion callback to the arguments our method will receive
		args.push(completeMethod)

		// Notify that we are now running
		this.state.status = 'running'
		this.emit('running')

		// Fire the method within the domain if desired, otherwise execute directly
		if ( taskDomain ) {
			taskDomain.run(fireMethod)
		}
		else {
			try {
				fireMethod()
			}
			catch (error) {
				exitMethod(error)
			}
		}

		// Chain
		return this
	}

	/**
	Start the execution of the task.
	Will emit an `error` event if the task has already started before.
	@chainable
	@returns {this}
	@access public
	*/
	run () {
		// Already started?
		if ( this.state.status !== 'created' ) {
			const error = new Error(`Invalid run status for the Task [${this.names}], it was [${this.state.status}] instead of [created].`)
			this.emit('error', error)
			return this
		}

		// Put it into pending state
		this.state.status = 'pending'
		this.emit('pending')

		// Queue the actual running so we can give time for the listeners to complete before continuing
		this.queue(() => this.fire())

		// Chain
		return this
	}
}

// Exports
module.exports = {Task}
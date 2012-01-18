## History

- v0.9 January 18, 2012
	- Added `exec`, `initNodeModules`, `initGitSubmodules`, `EventSystem.when`
	- Added support for no callbacks

- v0.8 November 2, 2011
	- Considerable improvements to `scandir`, `cpdir` and `rmdir`
		- Note, passing `false` as the file or dir actions will now skip all of that type. Pass `null` if you do not want that.
		- `dirAction` is now fired before we read the directories children, if you want it to fire after then in the next callback, pass a callback in the 3rd argument. See `rmdir` for an example of this.
	- Fixed npm web to url warnings

- v0.7 October 3, 2011
	- Added `versionCompare` and `packageCompare` functions
		- Added `request` dependency

- v0.6 September 14, 2011
	- Updated `util.Group` to support `async` and `sync` grouping

- v0.4 June 2, 2011
	- Added util.type for testing the type of a variable
	- Added util.expandPath and util.expandPaths

- v0.3 June 1, 2011
	- Added util.Group class for your async needs :)

- v0.2 May 20, 2011
	- Added some tests with expresso
	- util.scandir now returns err,list,tree
	- Added util.writetree

- v0.1 May 18, 2011
	- Initial commit
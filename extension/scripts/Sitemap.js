var Sitemap = function (sitemapObj) {
	this.initData(sitemapObj);
};

Sitemap.prototype = {

	initData: function (sitemapObj) {
		for (var key in sitemapObj) {
			this[key] = sitemapObj[key];
		}

		var selectors = this.selectors;
		this.selectors = new SelectorList(this.selectors);
	},

	/**
	 * Returns all selectors or recursively find and return all child selectors of a parent selector.
	 * @param parentSelectorId
	 * @returns {Array}
	 */
	getAllSelectors: function (parentSelectorId) {

		return this.selectors.getAllSelectors(parentSelectorId);
	},

	/**
	 * Returns only selectors that are directly under a parent
	 * @param parentSelectorId
	 * @returns {Array}
	 */
	getDirectChildSelectors: function (parentSelectorId) {
		return this.selectors.getDirectChildSelectors(parentSelectorId);
	},

	/**
	 * Returns all selector id parameters
	 * @returns {Array}
	 */
	getSelectorIds: function () {
		var ids = ['_root'];
		for (var i in this.selectors) {
			var selector = this.selectors[i];
			ids.push(selector.id);
		}
		return ids;
	},

	updateSelector: function (selector, selectorData) {

		// update child selectors
		if (selector.id !== undefined && selector.id !== selectorData.id) {
			this.selectors.forEach(function (currentSelector) {
				currentSelector.renameParentSelector(selector.id, selectorData.id)
			});

			// update cyclic selector
			var pos = selectorData.parentSelectors.indexOf(selector.id);
			if (pos !== -1) {
				selectorData.parentSelectors.splice(pos, 1, selectorData.id);
			}
		}

		selector.updateData(selectorData);

		if (this.getSelectorIds().indexOf(selector.id) === -1) {
			this.selectors.push(selector);
		}
	},
	deleteSelector: function (selectorToDelete) {

		this.selectors.forEach(function(selector) {
			if(selector.hasParentSelector(selectorToDelete.id)) {
				selector.removeParentSelector(selectorToDelete.id);
				if(selector.parentSelectors.length === 0) {
					this.deleteSelector(selector)
				}
			}
		}.bind(this));

		for (var i in this.selectors) {
			if (this.selectors[i].id === selectorToDelete.id) {
				this.selectors.splice(i, 1);
				break;
			}
		}
	},
	getDataTableId: function () {
		return this._id.replace(/\./g, '_');
	},
	exportSitemap: function () {
		var sitemapObj = JSON.parse(JSON.stringify(this));
		delete sitemapObj._rev;
		return JSON.stringify(sitemapObj);
	},
	importSitemap: function (sitemapJSON) {
		var sitemapObj = JSON.parse(sitemapJSON);
		this.initData(sitemapObj);
	},
	// return a list of columns than can be exported
	getDataColumns: function () {
		var columns = [];
		this.selectors.forEach(function (selector) {

			columns = columns.concat(selector.getDataColumns());
		});

		return columns;
	},
	getDataExportCsvBlob: function (data) {

		var columns = this.getDataColumns(),
			delimiter = ',',
			newline = "\n",
			csvData = [];

		// header
		csvData.push(columns.join(delimiter) + newline)

		// data
		data.forEach(function (row) {
			var rowData = [];
			columns.forEach(function (column) {
				var cellData = row[column];
				if (cellData === undefined) {
					cellData = "";
				}
				else if (typeof cellData === 'object') {
					cellData = JSON.stringify(cellData);
				}

				rowData.push('"' + cellData.replace(/"/g, '""').trim() + '"');
			});
			csvData.push(rowData.join(delimiter) + newline);
		});

		return new Blob(csvData, {type: 'text/csv'});
	},
	getSelectorById: function (selectorId) {
		return this.selectors.getSelectorById(selectorId);
	}
};


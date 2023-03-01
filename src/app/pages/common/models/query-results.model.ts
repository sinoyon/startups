export class QueryResultsModel {
	items: any[];
	totalCount: number;
	constructor(_items: any[] = [], _totalCount: number = 0) {
		this.items = _items.map( (item, index) => {
			item.id = item._id || index;

			return item;
		});
		this.totalCount = _totalCount || this.items.length;
	}
}

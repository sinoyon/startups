import { HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';


function getAPIPaginationFromTblData(param: any = { pageSize: 100, startRow: 0, endRow: 0, sortModel: [], filterModel: {}, groupKeys: [], rowGroupCols: []}){
	const result: any = {};
	result.size = param.pageSize || 100;
	result.page = result.size == 0 ? 1 : Math.trunc((param.startRow || 0) / result.size) + 1;

	if (param.state) {
		result.state = param.state;
	}
	if (param.countries) {
		result.countries = param.countries;
	}

	result.sort = {};
	if (param.sortModel) {
		param.sortModel.forEach( el => {
			const field = el.colId.replace(/_\d/, '');
			result.sort[field] = el.sort;
		});
	}
	result.filter = [];
	if (param.filterModel) {
		Object.keys(param.filterModel).forEach( el => {
			const field = el.replace(/_\d/, '');
			result.filter.push({
				key: field,
				...param.filterModel[el],
			});
		});
	}
	result.groupKeys = param.groupKeys;
	result.rowGroupCols = param.rowGroupCols;
	return result;
}

function getAPIHeaders(isJson = true) {
	const USERDATA_KEY = localStorage.getItem(environment.USERDATA_KEY);
	try {
		var accessToken =  USERDATA_KEY ? JSON.parse(USERDATA_KEY).accessToken: null;
	} catch (error) {
		localStorage.removeItem(environment.USERDATA_KEY);
	}
	if (isJson) {
		return new HttpHeaders().set('Content-Type', 'application/json').set('authorization', 'Bearer ' + accessToken);
	} else {
		return new HttpHeaders({authorization: 'Bearer ' + accessToken});
	}
}

export {
	getAPIHeaders,
	getAPIPaginationFromTblData
};

export async function saveToFile(data, filename = 'reports.json') {
	const handle = await window.showSaveFilePicker({
		suggestedName: filename,
		types: [{
			description: 'JSON file',
			accept: { 'application/json': ['.json'] }
		}]
	});
	const writable = await handle.createWritable();
	await writable.write(JSON.stringify(data, null, 2));
	await writable.close();
}
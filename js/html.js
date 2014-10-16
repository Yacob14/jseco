/**
 * Hide/show for "about"-dialog
 */
var desc, openDesc, closeDesc;

function htmlInteraction()
{
	desc = document.getElementById('desc');
	openDesc = document.getElementById('open-desc');
	closeDesc = document.getElementById('close-desc');
	
	openDesc.addEventListener('click', toggleDesc, false);
	closeDesc.addEventListener('click', toggleDesc, false);
	
	function toggleDesc()
	{
		if (desc.style.display === '' || desc.style.display === 'none')
			desc.style.display = 'block';
		else if (desc.style.display === 'block')
			desc.style.display = 'none';
	}
}
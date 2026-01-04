// Health Data Page JavaScript
$(document).ready(function() {
    console.log('Health Data page initialized');
    
    // Initialize DataTable if available
    if ($.fn.DataTable) {
        $('#allReadingsTable').DataTable({
            order: [[1, 'desc']],
            pageLength: 25
        });
    }
});

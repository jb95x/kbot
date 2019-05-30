function setupCompletions(completions) {
    $(document).ready(() => {
        $('input.autocomplete').autocomplete({
            data: completions,
            limit: 20, // The max amount of results that can be shown at once. Default: Infinity.
            onAutocomplete: function (val) {
                // Callback function when value is autcompleted.
            },
            minLength: 1 // The minimum length of the input for the autocomplete to start. Default: 1.
        });
    });
}

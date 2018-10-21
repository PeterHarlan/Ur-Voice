// Peter Harlan
// Make sure that jquary does not run before the document has been loaded
$(document).ready(function(){
	var questionOption = 2;
	var questionOption;

	if($("#pollResults").length>0)
	{
		calculatePercent();
	}

	// Once the user clicks addBtn, add another input that allows the uer to add another question option
	$("#addBtn").click(function(){

		//Show remove button
		$("#removeBtn").show();

		//While there is only less than 6 questions
		if($(".optionQuestion").length < 6)
		{
			//Add question option
			$("#optionList").append("<input class='form-control mt-2 optionQuestion' id='option" + ($(".optionQuestion").length+1) + "' name='option[]' placeholder='" + ($(".optionQuestion").length+1) + ". Option' required>");

			$("#optionList").append($("#feedback"));
		}
		if($(".optionQuestion").length >= 6)
		{
			$("#addBtn").hide();
		}
		// Length of the array
		// console.log("Array size is " + $(".optionQuestion").length);
	});

	// Removes a question option
	$("#removeBtn").click(function(){
		//How the add button
		$("#addBtn").show();

		if($(".optionQuestion").length>2){
			$("#optionList").children().last().prev().remove();
		}
		if($(".optionQuestion").length<=2){
			$("#removeBtn").hide();
		}
	});

	// Calcualte the percentage
	function calculatePercent()
	{
		console.log("Calculating percent...");
		var voteCount = $(".voteCount").toArray();
		var sum = 0;
		var percent = [];

		// Calculate the sum
		for (var i = 0; i < voteCount.length; i++)
		{
			sum += Number(voteCount[i].innerHTML);
		}
		// If the total vote is greater than 0
		if(sum>0){
			// Calculates the percentages
			for (var i = 0; i < voteCount.length; i++)
			{
				percent.push((Math.round((Number(voteCount[i].innerHTML)/sum)* 100)));
			}
			// Adds the percentage text
			$( ".percentage" ).each(function( index ) {
				$( this ).html("<strong>" + percent[index] + "%</strong>");
			});
			// Adds percent in width
			$( ".barPercent" ).each(function( index ) {
				$( this ).css({"width": percent[index] + "%", "transition-timing-function": "ease-in", "background": "rgb(30, 126, 52)", "color": "black"});
			});
		}
		else{
			// Each of the percent text is 0
			$( ".percentage" ).each(function( index ) {
				$( this ).html("<strong>" + 0 + "%</strong>");
			});
			// Add the percent width
			$( ".barPercent" ).each(function( index ) {
				$( this ).css({"width": + 0 + "%", "transition-timing-function": "ease-in", "background": "rgb(30, 126, 52)", "color": "black"});
			});
		}
		// Add the total sum value
		$("#voteTotal").html("<strong>Total: " + sum + "</strong>");
	}
});	

// Checks if user input is valid
(function() {
	'use strict';
	window.addEventListener('load', function() {
    // Fetches all form elements
    var forms = document.getElementsByClassName('needs-validation');
    // Loop over input to test if they are valid
    var validation = Array.prototype.filter.call(forms, function(form) {
    	form.addEventListener('submit', function(event) {
    		if (form.checkValidity() === false) {
    			event.preventDefault();
    			event.stopPropagation();
    		}
    		form.classList.add('was-validated');
    	}, false);
    });
}, false);
})();
